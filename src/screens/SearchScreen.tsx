import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import { STORAGE_KEYS } from '../config/storageKeys';
import { SearchBar } from '../components/ui';
import { Colors, Space } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type Props = { navigation: NavigationProp };

const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery]               = useState('');
  const [suggestions, setSuggestions]   = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.recentSearches).then(raw => {
      if (raw) try { setRecentSearches(JSON.parse(raw)); } catch {}
    });
  }, []);

  // Hardware back
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
          brands: [],
          categories: [],
          subCategories: [],
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
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#16130F" translucent />

      {/* TopBar */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.searchWrap}>
            <SearchBar
              value={query}
              onChangeText={handleChangeText}
              placeholder="Search products, brands…"
              onSubmit={() => commit(query)}
              autoFocus
            />
          </View>
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setQuery('')}
            >
              <Text style={styles.cancelText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions — live results while typing */}
      {showSuggestions && (
        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => `${item}-${i}`}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.row, index < suggestions.length - 1 && styles.rowDivider]}
              onPress={() => commit(item)}
              activeOpacity={0.7}
            >
              <Icon name="search-outline" size={16} color={Colors.ink4} style={styles.rowIcon} />
              <Text style={styles.rowText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => { setQuery(item); }}
              >
                <Icon name="arrow-redo-outline" size={16} color={Colors.ink4} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Recent searches */}
      {showRecent && (
        <FlatList
          data={recentSearches}
          keyExtractor={(item, i) => `${item}-${i}`}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          ListHeaderComponent={
            <View style={styles.recentHeader}>
              <Text style={styles.recentLabel}>RECENT</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearAll}>Clear all</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.row, index < recentSearches.length - 1 && styles.rowDivider]}
              onPress={() => commit(item)}
              activeOpacity={0.7}
            >
              <Icon name="time-outline" size={16} color={Colors.ink4} style={styles.rowIcon} />
              <Text style={styles.rowText} numberOfLines={1}>{item}</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => deleteRecent(item)}
              >
                <Icon name="close" size={16} color={Colors.ink4} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Empty state when typing but no results yet */}
      {query.trim().length >= 2 && suggestions.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No results for "{query}"</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    backgroundColor: '#16130F',
  },
  topBarRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[2],
    paddingBottom:     Space[3],
    gap:               Space[3],
  },
  backBtn: {
    width:  36,
    height: 36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
  },
  cancelBtn: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '600',
    color:      Colors.accent,
  },
  list: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  recentHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[4],
    paddingBottom:     Space[2],
  },
  recentLabel: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.8,
  },
  clearAll: {
    fontFamily: FontFamily.sans,
    fontSize:   13,
    fontWeight: '500',
    color:      Colors.ink3,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[4],
    backgroundColor:   Colors.surface,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  rowIcon: {
    marginRight: Space[3],
  },
  rowText: {
    ...Type.body,
    color: Colors.ink1,
    flex:  1,
  },
  empty: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingBottom:   80,
  },
  emptyText: {
    ...Type.caption,
    color: Colors.ink4,
  },
});

export default SearchScreen;
