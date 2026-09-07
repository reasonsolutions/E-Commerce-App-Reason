import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { getBrands } from '../api/product';
import type { GetBrandItem } from '../api/interfaces';
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
const COL_GAP   = Space[2];
const CARD_W    = (SCREEN_W - OUTER_PAD * 2 - COL_GAP * (NUM_COLS - 1)) / NUM_COLS;
const LOGO_SIZE = Math.round(CARD_W * 0.44);

type BrandsScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

const BrandCard: React.FC<{
  item: GetBrandItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const logoUri = item.BrandImage ? resolveImageUrl(item.BrandImage) : '';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.82} onPress={onPress}>
      <View style={styles.logoWrap}>
        <FadeImage
          uri={logoUri}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          resizeMode="contain"
          fallbackText={item.BrandName}
        />
      </View>
      <Text style={styles.brandName} numberOfLines={1}>{item.BrandName}</Text>
    </TouchableOpacity>
  );
};

const PAGE_SIZE = 50;

const BrandsScreen: React.FC<BrandsScreenProps> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [brands, setBrands] = useState<GetBrandItem[] | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);

  const { loading, isError, error, run } = useAsyncState<GetBrandItem[]>(null);

  const fetchInitiated = useRef(false);
  const loadMoreInFlight = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestId = useRef(0);

  const fetchBrands = useCallback((cancelled: { current: boolean }, search: string) => {
    const requestId = ++latestRequestId.current;
    run(async () => {
      const res = await getBrands(1, PAGE_SIZE, search || undefined);
      if (requestId !== latestRequestId.current || cancelled.current) return [];
      const list: GetBrandItem[] = (res?.statusCode === 1 && Array.isArray(res.result?.Brands)) ? res.result.Brands : [];
      setBrands(list);
      setPageNumber(1);
      setHasMore(list.length >= PAGE_SIZE);
      return list;
    }, cancelled);
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      if (fetchInitiated.current) return () => { cancelled.current = true; };
      fetchInitiated.current = true;
      fetchBrands(cancelled, '');
      return () => { cancelled.current = true; };
    }, [fetchBrands]),
  );

  useEffect(() => {
    if (!fetchInitiated.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const cancelled = { current: false };
      fetchBrands(cancelled, query.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadMore = useCallback(async () => {
    if (loadMoreInFlight.current || !hasMore || loading || !brands) return;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    try {
      const requestId = latestRequestId.current;
      const nextPage = pageNumber + 1;
      const res = await getBrands(nextPage, PAGE_SIZE, query.trim() || undefined);
      if (requestId !== latestRequestId.current) return;
      const next: GetBrandItem[] = (res?.statusCode === 1 && Array.isArray(res.result?.Brands)) ? res.result.Brands : [];
      if (next.length > 0) {
        setBrands(prev => {
          const seen = new Set((prev ?? []).map(b => b.BrandId));
          return [...(prev ?? []), ...next.filter(b => !seen.has(b.BrandId))];
        });
        setPageNumber(nextPage);
      }
      if (next.length < PAGE_SIZE) setHasMore(false);
    } catch {
    } finally {
      loadMoreInFlight.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, loading, brands, pageNumber, query]);

  const filtered = brands;

  const handleRetry = useCallback(() => {
    const cancelled = { current: false };
    fetchBrands(cancelled, query.trim());
  }, [fetchBrands, query]);

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load brands."
        message={error ?? 'Check your connection and try again.'}
        onRetry={handleRetry}
        retryLoading={loading}
      />
    );
  }

  const showSkeleton = loading && !brands;

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
            name="chevron-back"
            size={22}
            color={Colors.ink1}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Brands</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Hero subtitle ──────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <Text style={styles.heroSub}>
          Discover products from leading brands in fashion, electronics, and more.
        </Text>
      </View>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Icon name="search-outline" size={15} color={Colors.brandNavy} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search brands…"
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
        <Text style={styles.sectionLabel}>FEATURED BRANDS</Text>
      </View>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {showSkeleton ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[styles.card, { width: CARD_W }]}>
              <Skeleton width={LOGO_SIZE + 12} height={LOGO_SIZE + 12} radius={12} />
              <Skeleton width={CARD_W * 0.6} height={11} radius={4} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered ?? []}
          keyExtractor={item => String(item.BrandId)}
          numColumns={NUM_COLS}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No brands found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={Colors.ink3} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <BrandCard
              item={item}
              onPress={() => navigation.navigate('Result', { brandId: item.BrandId, categoryName: item.BrandName })}
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
    gap:               COL_GAP,
  },
  columnWrapper: {
    gap: COL_GAP,
  },
  card: {
    flex:              1,
    alignItems:        'center',
    paddingVertical:   Space[4],
    paddingHorizontal: Space[2],
    gap:               Space[2],
  },
  logoWrap: {
    width:           LOGO_SIZE + 12,
    height:          LOGO_SIZE + 12,
    borderRadius:    12,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     'rgba(0,0,0,0.05)',
  },
  brandName: {
    fontFamily:  FontFamily.sans,
    fontSize:    13,
    fontWeight:  '600',
    color:       Colors.ink1,
    textAlign:   'center',
    letterSpacing: 0,
  },
  skeletonGrid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    paddingHorizontal: OUTER_PAD,
    paddingTop:        Space[1],
    gap:               COL_GAP,
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
    paddingVertical: Space[5],
    alignItems:      'center',
  },
});

export default BrandsScreen;
