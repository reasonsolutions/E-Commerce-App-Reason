import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, getCategoryProductCount } from '../api/product';
import type { CategoryInterface } from '../api/interfaces';
import { useAsyncState } from '../hooks/useAsyncState';
import { FadeImage, Skeleton } from '../components/ui';
import { ErrorState } from '../components/system';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const { width: SCREEN_W } = Dimensions.get('window');

const OUTER_PAD = 14;
const NUM_COLS  = 3;
const TILE_GAP  = Space[3];
const TILE_W    = (SCREEN_W - OUTER_PAD * 2 - TILE_GAP * (NUM_COLS - 1)) / NUM_COLS;
const IMG_H     = Math.round(TILE_W * 1.0);

const TONE_GRADS: string[] = [
  '#E9E1D3', '#DEE2DC', '#EADBCF', '#DEDFDA', '#ECE5D7',
  '#DCD7CF', '#E9DCD5', '#D9D8C6', '#D6DADD',
];

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type CategoriesScreenProps = {
  navigation: NavigationProp;
};

interface CategoryWithCount extends CategoryInterface {
  productCount: number | null;
}

const CategoryCard: React.FC<{
  item: CategoryWithCount;
  index: number;
  onPress: () => void;
}> = ({ item, index, onPress }) => {
  const bgColor  = TONE_GRADS[index % TONE_GRADS.length];
  const imageUri = item.CategoryImage ? resolveImageUrl(item.CategoryImage) : '';

  return (
    <TouchableOpacity style={[styles.card, { width: TILE_W }]} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.imgWrap, { backgroundColor: bgColor }]}>
        <FadeImage
          uri={imageUri}
          width={TILE_W}
          height={IMG_H}
          resizeMode="cover"
          fallbackText={item.CategoryName}
          style={{ backgroundColor: bgColor }}
        />
      </View>
      <Text style={styles.catName} numberOfLines={2}>{item.CategoryName}</Text>
      {item.productCount !== null ? (
        <Text style={styles.catCount}>{item.productCount} products</Text>
      ) : (
        <Skeleton width={TILE_W * 0.6} height={9} radius={4} style={{ marginTop: 2 }} />
      )}
    </TouchableOpacity>
  );
};

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState<Record<number, number>>({});

  const { data: categories, loading, isError, error, run } = useAsyncState<CategoryInterface[]>(null);

  const fetchInitiated = React.useRef(false);

  const fetchCategories = useCallback((cancelled: { current: boolean }) => {
    run(async () => {
      const res = await getCategories();
      const list: CategoryInterface[] =
        (res?.statusCode === 1 && Array.isArray(res.result)) ? (res.result as CategoryInterface[]) : [];

      // Fire all count fetches in parallel — lightweight pageSize:1 calls
      Promise.all(
        list.map(c =>
          getCategoryProductCount(c.CategoryId)
            .then(count => {
              if (!cancelled.current) {
                setCounts(prev => ({ ...prev, [c.CategoryId]: count }));
              }
            })
            .catch(() => {}),
        ),
      );

      return list;
    }, cancelled);
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      if (fetchInitiated.current) return () => { cancelled.current = true; };
      fetchInitiated.current = true;
      fetchCategories(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchCategories]),
  );

  const categoriesWithCounts = useMemo((): CategoryWithCount[] | null => {
    if (!categories) return null;
    return categories.map(c => ({
      ...c,
      productCount: counts[c.CategoryId] ?? null,
    }));
  }, [categories, counts]);

  const filtered = useMemo(() => {
    if (!categoriesWithCounts) return null;
    const q = query.trim().toLowerCase();
    // Once a count has resolved (not null), hide categories with 0 products
    const nonEmpty = categoriesWithCounts.filter(c => c.productCount === null || c.productCount > 0);
    if (!q) return nonEmpty;
    return nonEmpty.filter(c => c.CategoryName.toLowerCase().includes(q));
  }, [categoriesWithCounts, query]);

  const handleRetry = useCallback(() => {
    fetchInitiated.current = false;
    setCounts({});
    const cancelled = { current: false };
    fetchCategories(cancelled);
  }, [fetchCategories]);

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load categories."
        message={error ?? 'Check your connection and try again.'}
        onRetry={handleRetry}
        retryLoading={loading}
      />
    );
  }

  const showSkeleton = loading && !categories;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={22}
            color={Colors.ink1}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Hero subtitle ──────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroSub}>Browse products across all categories.</Text>
      </View>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={15} color={Colors.ink4} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories…"
          placeholderTextColor={Colors.ink4}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Section label ──────────────────────────────────────────────────── */}
      <View style={styles.sectionLabelRow}>
        <Text style={styles.sectionLabel}>POPULAR CATEGORIES</Text>
      </View>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {showSkeleton ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCell, { width: TILE_W }]}>
              <Skeleton width={TILE_W} height={IMG_H} radius={20} />
              <Skeleton width={TILE_W * 0.7} height={11} radius={4} style={{ marginTop: 8 }} />
              <Skeleton width={TILE_W * 0.5} height={9} radius={4} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered ?? []}
          keyExtractor={item => String(item.CategoryId)}
          numColumns={NUM_COLS}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No categories found</Text>
            </View>
          }
          ListFooterComponent={
            filtered && filtered.length > 0 ? (
              <View style={styles.listFooter}>
                <View style={styles.listFooterRule} />
                <Text style={styles.listFooterText}>
                  {filtered.length} {filtered.length === 1 ? 'category' : 'categories'}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <CategoryCard
              item={item}
              index={index}
              onPress={() => navigation.navigate('Result', { categoryId: item.CategoryId, categoryName: item.CategoryName })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: OUTER_PAD,
    height:            52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    color:         Colors.ink1,
    letterSpacing: -0.2,
  },
  hero: {
    paddingHorizontal: OUTER_PAD,
    paddingTop:        Space[3],
    paddingBottom:     Space[1],
  },
  heroSub: {
    ...Type.caption,
    color:      Colors.ink3,
    lineHeight: 18,
  },
  searchWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  OUTER_PAD,
    marginTop:         Space[3],
    marginBottom:      Space[2],
    paddingHorizontal: Space[3],
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      10,
    height:            34,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
  },
  sectionLabelRow: {
    paddingHorizontal: OUTER_PAD,
    paddingTop:        Space[3],
    paddingBottom:     Space[2],
  },
  sectionLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.5,
  },
  searchIcon: {
    marginRight: Space[2],
  },
  searchInput: {
    flex:            1,
    fontFamily:      FontFamily.sans,
    fontSize:        14,
    color:           Colors.ink1,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: OUTER_PAD,
    paddingBottom:     120,
    paddingTop:        Space[1],
    gap:               Space[5],
  },
  columnWrapper: {
    gap: TILE_GAP,
  },
  card: {
    alignItems: 'center',
    gap:        Space[2],
  },
  imgWrap: {
    width:        TILE_W,
    height:       IMG_H,
    borderRadius: 20,
    overflow:     'hidden',
    borderWidth:  StyleSheet.hairlineWidth,
    borderColor:  'rgba(0,0,0,0.04)',
  },
  catName: {
    fontFamily:  FontFamily.sans,
    fontSize:    12.5,
    fontWeight:  '600',
    color:       Colors.ink1,
    textAlign:   'center',
    lineHeight:  16,
  },
  catCount: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 0.6,
    textTransform: 'none',
    fontSize:      10,
  },
  skeletonGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: OUTER_PAD,
    paddingTop:        Space[1],
    gap:               TILE_GAP,
  },
  skeletonCell: {
    alignItems:   'center',
    marginBottom: Space[3],
  },
  emptyWrap: {
    paddingTop: Space[10],
    alignItems: 'center',
  },
  emptyText: {
    ...Type.caption,
    color: Colors.ink4,
  },
  listFooter: {
    alignItems:  'center',
    paddingTop:  Space[6],
    paddingBottom: Space[4],
    gap:         Space[2],
  },
  listFooterRule: {
    width:           40,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },
  listFooterText: {
    ...Type.label,
    color:         Colors.ink5,
    letterSpacing: 1,
    fontSize:      10,
  },
});

export default CategoriesScreen;
