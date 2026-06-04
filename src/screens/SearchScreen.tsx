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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import { STORAGE_KEYS } from '../config/storageKeys';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type Props = { navigation: NavigationProp };

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const insets      = useSafeAreaInsets();
  const inputRef    = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query,         setQuery]         = useState('');
  const [suggestions,   setSuggestions]   = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.recentSearches).then(raw => {
      if (raw) try { setRecentSearches(JSON.parse(raw)); } catch {}
    });
    // Auto-focus after mount
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

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
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
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const commit = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 8);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(updated));
    navigation.navigate('Result', { searchQuery: trimmed, categoryName: `"${trimmed}"` });
  }, [navigation, recentSearches]);

  const deleteRecent = useCallback(async (item: string) => {
    const updated = recentSearches.filter(s => s !== item);
    setRecentSearches(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(updated));
  }, [recentSearches]);

  const clearAll = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.recentSearches);
  }, []);

  const showSuggestions = query.trim().length >= 2 && suggestions.length > 0;
  const showRecent      = query.trim().length === 0 && recentSearches.length > 0;

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
          <Icon name="arrow-back" size={22} color={Colors.ink1} />
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
              onPress={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close-circle" size={16} color={Colors.ink4} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.headerDivider} />

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

      {/* ── No results nudge ─────────────────────────────────────────────── */}
      {query.trim().length >= 2 && !showSuggestions && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
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

  // ── Empty ───────────────────────────────────────────────────────────────────
  empty: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  80,
  },
  emptyText: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

export default SearchScreen;
