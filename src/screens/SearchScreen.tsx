import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  BackHandler,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { EmptyState } from '../components/ui';
import { ErrorState } from '../components/system';
import { homeCache } from '../utils/homeCache';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import type { CategoryInterface } from '../api/interfaces';

type Props = { navigation: StackNavigationProp<RootStackParamList> };

let _allProductsCallCount = 0; // TEMP — remove after measuring

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const insets      = useSafeAreaInsets();
  const inputRef    = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,          setQuery]          = useState('');
  const [suggestions,    setSuggestions]    = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchError,    setSearchError]    = useState(false);
  const [retrying,       setRetrying]       = useState(false);
  const [cachedCategories, setCachedCategories] = useState<CategoryInterface[] | null>(homeCache.categories);
  const lastQueryRef    = useRef('');
  const profileCodeRef  = useRef<number | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(userRaw => {
      const code: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
      profileCodeRef.current = code;
      return AsyncStorage.getItem(scopedKey('recentSearches', code));
    }).then(raw => {
      if (raw) try { setRecentSearches(JSON.parse(raw)); } catch {}
    }).catch(() => {});
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [navigation]);

  // Re-sync from homeCache on focus — HomeScreen may not have fetched yet on first mount
  useFocusEffect(
    useCallback(() => {
      setCachedCategories(homeCache.categories);
    }, []),
  );

  const fetchSuggestions = useCallback(async (text: string) => {
    try {
      console.log(`[allProducts] SearchScreen fetchSuggestions #${++_allProductsCallCount} ("${text}")`); // TEMP — remove after measuring
      const response = await axiosInstance.post(productEndpoints.allProducts, {
        brands: [], categories: [], subCategories: [],
        searchQuery: text.trim(),
        priceRange: { from: null, to: null },
        discount: null,
        pagination: { pageNumber: 1, pageSize: 8 },
      });
      const names: string[] = Array.from(
        new Set<string>(
          (response.data?.result?.Products ?? [])
            .map((p: any) => p.Name as string)
            .filter(Boolean),
        ),
      );
      setSuggestions(names);
      setSearchError(false);
    } catch {
      setSuggestions([]);
      setSearchError(true);
    }
  }, []);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setSearchError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    lastQueryRef.current = text;
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  }, [fetchSuggestions]);

  const handleRetry = useCallback(async () => {
    if (retrying || lastQueryRef.current.trim().length < 2) return;
    setRetrying(true);
    await fetchSuggestions(lastQueryRef.current);
    setRetrying(false);
  }, [retrying, fetchSuggestions]);

  const commit = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 8);
    setRecentSearches(updated);
    await AsyncStorage.setItem(scopedKey('recentSearches', profileCodeRef.current), JSON.stringify(updated));
    navigation.navigate('Result', { searchQuery: trimmed, categoryName: `"${trimmed}"` });
  }, [navigation, recentSearches]);

  const deleteRecent = useCallback(async (item: string) => {
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    await AsyncStorage.setItem(scopedKey('recentSearches', profileCodeRef.current), JSON.stringify(updated));
  }, [recentSearches]);

  const clearAll = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(scopedKey('recentSearches', profileCodeRef.current));
  }, []);

  const trimmedQuery    = query.trim();
  const showSuggestions = trimmedQuery.length >= 2 && suggestions.length > 0 && !searchError;
  const showRecent      = trimmedQuery.length === 0 && recentSearches.length > 0;
  const showFTU         = trimmedQuery.length === 0 && recentSearches.length === 0;
  const showNoResults   = trimmedQuery.length >= 2 && !showSuggestions && !searchError;
  const showError       = searchError && trimmedQuery.length >= 2;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Header row: back + search input ──────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <Icon name="chevron-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>

        <View style={styles.inputWrap}>
          <Icon name="search-outline" size={16} color={Colors.ink4} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleChangeText}
            placeholder="Search products, brands…"
            placeholderTextColor={Colors.ink4}
            onSubmitEditing={() => commit(query)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setSearchError(false);
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close-circle" size={16} color={Colors.ink4} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.headerDivider} />

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {showError && (
        <View style={styles.stateWrap}>
          <ErrorState
            title="Search unavailable."
            message="We couldn't complete your search. Check your connection."
            onRetry={handleRetry}
            retryLoading={retrying}
          />
        </View>
      )}

      {/* ── Suggestions ──────────────────────────────────────────────────── */}
      {showSuggestions && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => `${item}-${i}`}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => commit(item)}
              activeOpacity={0.7}
            >
              <Icon name="search-outline" size={16} color={Colors.ink3} style={styles.rowIcon} />
              <Text style={styles.rowText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => { setQuery(item); handleChangeText(item); }}
              >
                <Icon name="arrow-up-outline" size={16} color={Colors.ink4} style={styles.fillIcon} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── Recent searches ───────────────────────────────────────────────── */}
      {showRecent && (
        <FlatList
          data={recentSearches}
          keyExtractor={(item, i) => `${item}-${i}`}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ListHeaderComponent={
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recent</Text>
              <TouchableOpacity onPress={clearAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => commit(item)}
              activeOpacity={0.7}
            >
              <Icon name="time-outline" size={16} color={Colors.ink3} style={styles.rowIcon} />
              <Text style={styles.rowText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => deleteRecent(item)}
              >
                <Icon name="close" size={16} color={Colors.ink4} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── No results ────────────────────────────────────────────────────── */}
      {showNoResults && (
        <View style={styles.stateWrap}>
          <EmptyState
            icon={<Icon name="search-outline" size={22} color={Colors.ink4} />}
            title="No results found."
            body="Try different keywords or browse all products."
            action={
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Result', {
                  categoryName: 'All Products',
                  searchQuery: '%',
                })}
                activeOpacity={0.88}
                accessibilityRole="button"
              >
                <Text style={styles.emptyBtnText}>Browse All Products</Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* ── First-time user — category chips from live catalog ──────────── */}
      {showFTU && (cachedCategories?.length ?? 0) > 0 && (
        <ScrollView
          style={styles.ftuScroll}
          contentContainerStyle={styles.ftuContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.ftuLabel}>BROWSE BY CATEGORY</Text>
          <View style={styles.chipWrap}>
            {cachedCategories!.map(cat => (
              <TouchableOpacity
                key={cat.CategoryId}
                style={styles.chip}
                onPress={() => navigation.navigate('Result', { categoryId: String(cat.CategoryId), categoryName: cat.CategoryName })}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${cat.CategoryName}`}
              >
                <Text style={styles.chipText}>{cat.CategoryName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[3],
    gap:               Space[3],
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surfaceSoft,
    borderRadius:    Radius.pill,
    paddingHorizontal: Space[3],
    height:          40,
    gap:             Space[2],
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex:       1,
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '400',
    color:      Colors.ink1,
    paddingVertical: 0,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── List ────────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[3],
  },
  sectionLabel: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '600',
    color:         Colors.ink2,
    letterSpacing: 0,
  },
  clearAll: {
    ...Type.caption,
    color: Colors.ink3,
  },

  // ── Row ─────────────────────────────────────────────────────────────────────
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  rowIcon: {
    marginRight: Space[3],
    flexShrink:  0,
  },
  rowText: {
    fontFamily: FontFamily.sans,
    fontSize:   15,
    fontWeight: '500',
    color:      Colors.ink1,
    flex:       1,
  },
  fillIcon: {
    transform: [{ rotate: '45deg' }],
  },

  // ── State wrap ──────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
  },

  // ── Empty state CTA ─────────────────────────────────────────────────────────
  emptyBtn: {
    height:          44,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingHorizontal: Space[6],
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       Space[2],
  },
  emptyBtnText: {
    ...Type.bodyStrong,
    color:    '#FFFFFF',
    fontSize: 15,
  },

  // ── First-time user chips ────────────────────────────────────────────────────
  ftuScroll: {
    flex: 1,
  },
  ftuContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[6],
    paddingBottom:     Space[10],
  },
  ftuLabel: {
    ...Type.label,
    fontSize:      10,
    letterSpacing: 1.4,
    color:         Colors.ink4,
    marginBottom:  Space[4],
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Space[2],
  },
  chip: {
    paddingVertical:   Space[2],
    paddingHorizontal: Space[4],
    backgroundColor:   Colors.surfaceSoft,
    borderRadius:      Radius.pill,
    borderWidth:       StyleSheet.hairlineWidth,
    borderColor:       Colors.rule,
  },
  chipText: {
    ...Type.caption,
    color:      Colors.ink2,
    fontWeight: '500',
  },
});

export default SearchScreen;
