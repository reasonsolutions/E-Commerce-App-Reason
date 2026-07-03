import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Alert,
  BackHandler,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import styles from './HomeScreen.styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { CategoryInterface, ProductInterface, GetBrandItem } from '../api/interfaces';
import { getProductsByCategory, getCategories, getBrands } from '../api/product';
import { getWishlist } from '../api/wishlist';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { clearSession } from '../utils/auth';
import { homeCache } from '../utils/homeCache';
import { wishlistCache } from '../utils/wishlistCache';
import type { WishlistItemInterface } from '../api/interfaces';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { BRAND } from '../config/brand';
import { useAsyncState } from '../hooks/useAsyncState';
import {
  SearchBar, Skeleton,
  SectionHead, BrandTile, CategoryTile, ProductRail, ProductGrid, TrustStrip,
} from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space } from '../theme';
import { Motion } from '../theme/motion';

const { width: SCREEN_W } = Dimensions.get('window');

// Category tile fixed width — circle 68px + label, 5+ visible with a peek
const categoryTileW = 76;

// ── Recently viewed snapshot — only the fields ProductCard actually reads ────
interface RecentlyViewedItem {
  ItemID:          number;
  Name:            string;
  BrandName:       string;
  Images:          string;
  MinPrice:        number;
  MaxComparePrice: number;
  DiscountPct?:    number;
  Inventory_Id?:   number | null;
}

// ── Spotlight shape for BannerSlot ────────────────────────────────────────────
interface Spotlight {
  kind: 'product' | 'category';
  eyebrow: string;
  title: string;
  sub: string;
  cta: string;
  imageUri: string;
  theme: 'photo' | 'split';
  itemId?: number;
  categoryId?: number;
}

// ── Single banner card ─────────────────────────────────────────────────────────
const BannerCard: React.FC<{ spot: Spotlight; height: number; onPress: () => void }> = ({
  spot,
  height,
  onPress,
}) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: Motion.duration.settle, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const isEditorial = spot.theme === 'split';

  return (
    <TouchableOpacity style={[styles.bannerCard, { height }]} activeOpacity={0.92} onPress={onPress}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.ink1 }]} />
      {spot.imageUri ? (
        <Animated.Image
          source={{ uri: spot.imageUri }}
          style={[StyleSheet.absoluteFillObject, styles.bannerImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      ) : null}
      {/* Bottom scrim — text legibility on any image */}
      <LinearGradient
        colors={['rgba(18,15,12,0)', 'rgba(18,15,12,0.28)', 'rgba(18,15,12,0.78)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {/* Left vignette — consistent text contrast regardless of image brightness */}
      <LinearGradient
        colors={['rgba(18,15,12,0.62)', 'rgba(18,15,12,0.20)', 'rgba(18,15,12,0)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={[styles.bannerContent, isEditorial && styles.bannerContentSplit]}>
        <Text style={styles.bannerEyebrow}>{spot.eyebrow}</Text>
        <Text style={[styles.bannerTitle, isEditorial && styles.bannerTitleItalic]} numberOfLines={2}>
          {spot.title}
        </Text>
        <Text style={styles.bannerSub} numberOfLines={2}>{spot.sub}</Text>
        <View style={styles.bannerCtaWrap}>
          <View style={styles.bannerCta}>
            <Text style={styles.bannerCtaText}>{spot.cta}</Text>
            <Icon name="arrow-forward" size={13} color={Colors.ink1} />
          </View>
        </View>
      </View>

    </TouchableOpacity>
  );
};

// ── BannerSlot — manual swipe, bounded cards, dots below ─────────────────────
const BannerSlot: React.FC<{
  spots: Spotlight[] | null;
  onPress: (spot: Spotlight) => void;
}> = ({ spots, onPress }) => {
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);
  const BANNER_H = 300;
  const CARD_W = SCREEN_W - Space.screenH * 2;

  if (spots === null) {
    return (
      <View style={styles.bannerSlot}>
        <Skeleton height={BANNER_H} radius={20} style={{ marginHorizontal: Space.screenH }} />
      </View>
    );
  }

  if (spots.length === 0) return null;

  return (
    <View style={styles.bannerSlot}>
      <FlatList
        ref={listRef}
        data={spots}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + Space[4]}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: Space.screenH, gap: Space[4] }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + Space[4]));
          setActive(Math.min(idx, spots.length - 1));
        }}
        renderItem={({ item }) => (
          <View style={{ width: CARD_W }}>
            <BannerCard spot={item} height={BANNER_H} onPress={() => onPress(item)} />
          </View>
        )}
      />
      {spots.length > 1 && (
        <View style={styles.bannerDots}>
          {spots.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setActive(i);
                listRef.current?.scrollToOffset({ offset: i * (CARD_W + Space[4]), animated: true });
              }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1}`}
            >
              <View style={[styles.bannerDot, i === active && styles.bannerDotActive]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ── Back-press / logout logic ─────────────────────────────────────────────────
type NavigationProp = StackNavigationProp<RootStackParamList>;

function useCustomBackHandler(navigation: NavigationProp) {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        AsyncStorage.getItem(STORAGE_KEYS.userData).then((user) => {
          const routeHistory = navigation?.getState?.()?.routes;
          const cameFromLogin =
            routeHistory &&
            routeHistory.length > 1 &&
            routeHistory[routeHistory.length - 2]?.name === 'Login';
          if (user && cameFromLogin) {
            Alert.alert(
              'Log Out',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes',
                  onPress: async () => {
                    await clearSession();
                    navigation.navigate('Home');
                  },
                },
              ],
              { cancelable: true },
            );
          }
        });
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => { sub.remove(); };
    }, [navigation]),
  );
}


// Module-level product cache — survives remounts within an app session
// categories + brands also written to homeCache so SearchScreen can read them
let _cachedProducts:   ProductInterface[]  | null = null;
let _cachedCategories: CategoryInterface[] | null = homeCache.categories;
let _cachedBrands:     GetBrandItem[]      | null = homeCache.brands;

type HomeScreenProps = { navigation: NavigationProp };

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  useCustomBackHandler(navigation);
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  // ── Wishlist map — inventoryId → wishlistCode, loaded for logged-in users ────
  const [wishlistMap, setWishlistMap] = useState<Map<number, number>>(new Map());
  const wishlistFetchTime = useRef(0);

  // ── Recently viewed ───────────────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // ── Scroll to top ─────────────────────────────────────────────────────────────
  const scrollRef        = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > 900;
    setShowScrollTop(prev => {
      if (prev !== shouldShow) {
        Animated.timing(scrollTopOpacity, {
          toValue:         shouldShow ? 1 : 0,
          duration:        200,
          useNativeDriver: true,
        }).start();
      }
      return shouldShow;
    });
  }, [scrollTopOpacity]);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // ── Resume cart cue ───────────────────────────────────────────────────────────
  const [showResumeCue, setShowResumeCue] = useState(false);

  // ── Data fetches — initialised from module-level cache so remounts show data instantly ──
  const { data: categories, run: runCategories, isError: categoriesError } = useAsyncState<CategoryInterface[]>(_cachedCategories);
  const { data: products,   run: runProducts,   isError: productsError   } = useAsyncState<ProductInterface[]>(_cachedProducts);
  const { data: brands,     run: runBrands,     isError: brandsError     } = useAsyncState<GetBrandItem[]>(_cachedBrands);

  // Risk 2 fix: cartCount change only updates the cue, never re-fires API calls
  useEffect(() => {
    setShowResumeCue(cartCount > 0);
  }, [cartCount]);

  // Tracks whether fetches have been initiated this session — prevents re-firing
  // when individual fetches complete and change the state that deps previously read.
  const fetchInitiated = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };

      // Always refresh recently viewed — read from user-scoped key
      AsyncStorage.getItem(STORAGE_KEYS.userData).then(userRaw => {
        const code: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
        return AsyncStorage.getItem(scopedKey('recentlyViewed', code));
      }).then(raw => {
        if (raw && !cancelled.current) {
          try { setRecentlyViewed(JSON.parse(raw)); } catch {}
        }
      }).catch(() => {});

      // Refresh wishlist map when cache is stale (invalidated by any mutation)
      const isWishlistStale = wishlistCache.lastFetchTime === 0
        || wishlistCache.lastFetchTime > wishlistFetchTime.current;
      if (isWishlistStale) {
        AsyncStorage.getItem(STORAGE_KEYS.userData).then(async (userRaw) => {
          const profileCode: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
          if (!profileCode) { setWishlistMap(new Map()); return; }
          try {
            const res = await getWishlist(profileCode);
            if (cancelled.current) return;
            if (res?.statusCode === 1 && Array.isArray(res.result)) {
              const map = new Map<number, number>();
              for (const item of res.result as WishlistItemInterface[]) {
                if (item.InventoryID != null && item.WishlistCode != null) {
                  map.set(item.InventoryID, item.WishlistCode);
                }
              }
              setWishlistMap(map);
              wishlistFetchTime.current = Date.now();
            }
          } catch {}
        }).catch(() => {});
      }

      // Skip if already fetching or if all data is cached — prevents re-firing on
      // focus events and prevents the dep-change loop (completed fetch changes state
      // → callback recreates → fetches restart → cancels previous in-flight results).
      if (fetchInitiated.current || (_cachedCategories && _cachedProducts && _cachedBrands)) {
        return () => { cancelled.current = true; };
      }

      fetchInitiated.current = true;

      // Fetch categories once and share the result with both the categories
      // state and the product-rail fetch, instead of calling getCategories() twice.
      const categoriesPromise = getCategories();

      runCategories(async () => {
        const res = await categoriesPromise;
        const result: CategoryInterface[] = (res?.statusCode === 1 && Array.isArray(res.result)) ? res.result : [];
        _cachedCategories = result;
        homeCache.categories = result;
        return result;
      }, cancelled);

      runProducts(async () => {
        const catRes = await categoriesPromise;
        const cats: CategoryInterface[] = (catRes?.statusCode === 1 && Array.isArray(catRes.result)) ? catRes.result : [];
        if (!cats.length) return [];
        const ids = cats.slice(0, 4).map((c) => c.CategoryId);
        const results = await Promise.all(ids.map((id) => getProductsByCategory(id, 1, 10).catch(() => [])));
        const merged = results.flat() as ProductInterface[];
        const seen = new Set<number>();
        const deduped: ProductInterface[] = [];
        for (const p of merged) {
          if (!seen.has(p.ItemID)) {
            seen.add(p.ItemID);
            deduped.push(p);
          }
        }
        _cachedProducts = deduped;
        return deduped;
      }, cancelled);

      runBrands(async () => {
        const res = await getBrands();
        const list: GetBrandItem[] = (Array.isArray(res?.result)) ? res.result : [];
        const result = list.slice(0, 8);
        _cachedBrands = result;
        homeCache.brands = result;
        return result;
      }, cancelled);

      return () => { cancelled.current = true; };
    }, [runCategories, runProducts, runBrands]),
  );

  // ── Retry all fetches — clears module cache so useFocusEffect re-fires ──────────
  const handleRetryFeed = useCallback(() => {
    _cachedCategories = null;
    _cachedProducts   = null;
    _cachedBrands     = null;
    homeCache.categories = null;
    homeCache.brands     = null;
    fetchInitiated.current = false;
    const cancelled = { current: false };
    const categoriesPromise = getCategories();
    runCategories(async () => {
      const res = await categoriesPromise;
      const result: CategoryInterface[] = (res?.statusCode === 1 && Array.isArray(res.result)) ? res.result : [];
      _cachedCategories = result;
      homeCache.categories = result;
      return result;
    }, cancelled);
    runProducts(async () => {
      const catRes = await categoriesPromise;
      const cats: CategoryInterface[] = (catRes?.statusCode === 1 && Array.isArray(catRes.result)) ? catRes.result : [];
      if (!cats.length) return [];
      const ids = cats.slice(0, 4).map((c) => c.CategoryId);
      const results = await Promise.all(ids.map((id) => getProductsByCategory(id, 1, 10).catch(() => [])));
      const merged = results.flat() as ProductInterface[];
      const seen = new Set<number>();
      const deduped: ProductInterface[] = [];
      for (const p of merged) {
        if (!seen.has(p.ItemID)) { seen.add(p.ItemID); deduped.push(p); }
      }
      _cachedProducts = deduped;
      return deduped;
    }, cancelled);
    runBrands(async () => {
      const res = await getBrands();
      const list: GetBrandItem[] = Array.isArray(res?.result) ? res.result : [];
      const result = list.slice(0, 8);
      _cachedBrands = result;
      homeCache.brands = result;
      return result;
    }, cancelled);
  }, [runCategories, runProducts, runBrands]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.resolve(handleRetryFeed());
    setRefreshing(false);
  }, [handleRetryFeed]);

  // Feed is in error when all three fetches failed and there is no cached data at all
  // Any single fetch error is enough to show the error state when there's no cached data
  const feedError = (categoriesError || productsError || brandsError)
    && !categories && !products && !brands;

  // ── Derived data (memoised — recomputes only when source data changes) ────────
  const deduped = useMemo(
    () => products
      ? Array.from(new Map(products.filter(p => p.ItemID != null).map(p => [p.ItemID, p])).values())
      : null,
    [products],
  );

  const smartBuys = useMemo(
    () => deduped
      ? deduped.filter(p => p.MaxComparePrice > p.MinPrice && p.MinPrice > 0)
      : null,
    [deduped],
  );

  // New arrivals — sorted by CreatedDate, most recent first
  const newArrivals = useMemo(
    () => deduped
      ? [...deduped].sort((a, b) => new Date(b.CreatedDate).getTime() - new Date(a.CreatedDate).getTime())
      : null,
    [deduped],
  );

  // Featured category — the category with the most real fetched products,
  // shown as its own curated rail (e.g. "Footwear") instead of one more
  // generic grid. Label is the real CategoryName — no invented copy.
  const featuredCategoryName = useMemo(() => {
    if (!deduped || deduped.length === 0) return null;
    const counts = new Map<string, number>();
    for (const p of deduped) {
      if (!p.CategoryName) continue;
      counts.set(p.CategoryName, (counts.get(p.CategoryName) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [name, count] of counts) {
      if (count > bestCount) { best = name; bestCount = count; }
    }
    return bestCount >= 3 ? best : null;
  }, [deduped]);

  const featuredCategoryProducts = useMemo(
    () => (deduped && featuredCategoryName)
      ? deduped.filter(p => p.CategoryName === featuredCategoryName)
      : null,
    [deduped, featuredCategoryName],
  );


  // Hero banners — real merchandising: brand + its best real discount, picked
  // from the brand with the single highest-discount product. Falls back to
  // category banners if there's no discounted product data yet.
  const spotlights: Spotlight[] | null = useMemo(() => {
    if (deduped === null) return null;

    const bestPerBrand = new Map<string, ProductInterface>();
    for (const p of deduped) {
      if (!(p.MaxComparePrice > p.MinPrice) || !p.BrandName) continue;
      const existing = bestPerBrand.get(p.BrandName);
      if (!existing || p.DiscountPct > existing.DiscountPct) {
        bestPerBrand.set(p.BrandName, p);
      }
    }

    const topProducts = Array.from(bestPerBrand.values())
      .sort((a, b) => b.DiscountPct - a.DiscountPct)
      .slice(0, 2);

    if (topProducts.length > 0) {
      return topProducts.map(p => ({
        kind:     'product' as const,
        eyebrow:  p.BrandName.toUpperCase(),
        title:    p.BrandName,
        sub:      p.CategoryName ?? '',
        cta:      'Shop Collection',
        imageUri: resolveImageUrl(p.Images),
        theme:    'split' as const,
        itemId:   p.ItemID,
      }));
    }

    // Fallback — no discounted products yet, use category banners
    if (!categories) return null;
    return categories
      .filter(c => c.CategoryImage)
      .slice(0, 2)
      .map(c => ({
        kind:       'category' as const,
        eyebrow:    'EXPLORE',
        title:      c.CategoryName,
        sub:        `Browse all ${c.CategoryName}`,
        cta:        `Explore ${c.CategoryName}`,
        imageUri:   resolveImageUrl(c.CategoryImage),
        theme:      'split' as const,
        categoryId: c.CategoryId,
      }));
  }, [deduped, categories]);

  const handleBannerPress = useCallback((spot: Spotlight) => {
    if (spot.kind === 'product' && spot.itemId) {
      navigation.navigate('Product', { product: String(spot.itemId) });
    } else if (spot.kind === 'category' && spot.categoryId) {
      navigation.navigate('Result', { categoryId: String(spot.categoryId), categoryName: spot.title });
    }
  }, [navigation]);

  const clearRecentlyViewed = useCallback(async () => {
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    const code: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
    await AsyncStorage.removeItem(scopedKey('recentlyViewed', code));
    setRecentlyViewed([]);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── TopBar ────────────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <Text style={styles.wordmark}>
            {BRAND.name}<Text style={styles.wordmarkDot}>.</Text>
          </Text>
          <View style={styles.topBarIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Wishlist')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="heart-outline" size={22} color={Colors.ink1} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Cart')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="bag-outline" size={22} color={Colors.ink1} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Search bar — tapping navigates to SearchScreen */}
        <TouchableOpacity
          style={styles.searchWrap}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Search')}
        >
          <SearchBar
            value=""
            onChangeText={() => {}}
            placeholder="Search products, brands…"
            editable={false}
          />
        </TouchableOpacity>

        {/* Resume cart cue */}
        {showResumeCue && cartCount > 0 && (
          <TouchableOpacity
            style={styles.resumeCue}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <View style={styles.resumeLeft}>
              <Icon name="bag-outline" size={16} color={Colors.accent} />
              <Text style={styles.resumeText}>
                {cartCount} {cartCount === 1 ? 'item' : 'items'} waiting in your bag
              </Text>
            </View>
            <View style={styles.resumeRight}>
              <Text style={styles.resumeAction}>Resume</Text>
              <Icon name="arrow-forward" size={14} color={Colors.accent} />
            </View>
          </TouchableOpacity>
        )}
      </View>


      {/* ── Scrollable content ────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Feed error */}
        {feedError ? (
          <ErrorState
            title="Feed didn't load."
            message="Check your connection and try again."
            onRetry={handleRetryFeed}
            retryLoading={categoriesError && productsError && brandsError && !categories && !products && !brands}
          />
        ) : null}

        {/* 1. Hero banners */}
        {!feedError && (
          <View style={{ marginTop: Space[5] }}>
            <BannerSlot spots={spotlights} onPress={handleBannerPress} />
          </View>
        )}

        {/* 2. Trust signals — horizontal single-row strip */}
        {!feedError && <TrustStrip />}

        {/* 3. Shop by category — directly after trust, before any products */}
        {!feedError && (
          <View style={styles.discoveryBand}>
            <SectionHead
              eyebrow="SHOP BY"
              title="Category"
              action="All"
              onAction={() => navigation.navigate('Categories')}
            />
            {categories ? (
              <FlatList
                data={categories}
                keyExtractor={(item) => String(item.CategoryId)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRail}
                renderItem={({ item, index }) => (
                  <CategoryTile
                    name={item.CategoryName}
                    imageUri={item.CategoryImage}
                    index={index}
                    width={categoryTileW}
                    onPress={() => navigation.navigate('Result', { categoryId: String(item.CategoryId), categoryName: item.CategoryName })}
                  />
                )}
              />
            ) : !categoriesError ? (
              <View style={styles.categoryRailSkeleton}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={{ alignItems: 'center', gap: Space[2], width: 76 }}>
                    <Skeleton width={68} height={68} radius={34} />
                    <Skeleton width={48} height={9} />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* 4. New arrivals — surface (default), horizontal rail */}
        {(newArrivals === null || (newArrivals && newArrivals.length > 0)) && (
          <View style={styles.sectionSurface}>
            <ProductRail
              eyebrow="JUST IN"
              title="New arrivals"
              items={newArrivals}
              cardWidth={148}
              actionLabel="See all"
              onSeeAll={() => navigation.navigate('Result', { categoryName: 'New Arrivals' })}
              onPress={(itemId) => navigation.navigate('Product', { product: String(itemId) })}
              wishlistMap={wishlistMap}
            />
          </View>
        )}

        {/* 5. Best deals — surfaceDeep (warm cream), 2-col grid */}
        {(smartBuys === null || (smartBuys && smartBuys.length > 0)) && (
          <View style={styles.sectionDeep}>
            <ProductGrid
              eyebrow="ON SALE"
              title="Best deals"
              items={smartBuys}
              onSeeAll={() => navigation.navigate('Result', { categoryName: 'Deals' })}
              onPress={(itemId) => navigation.navigate('Product', { product: String(itemId) })}
              wishlistMap={wishlistMap}
            />
          </View>
        )}

        {/* 6. Brands — surfaceSoft, breaks rhythm after the grid */}
        {!feedError && (
          <View style={styles.sectionSoft}>
            <SectionHead
              eyebrow="FEATURED"
              title="Brands"
              action="View all"
              onAction={() => navigation.navigate('Brands')}
            />
            {brands ? (
              <FlatList
                data={brands}
                keyExtractor={(item) => String(item.BrandId)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsRail}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('Result', { brandId: item.BrandId, categoryName: item.BrandName })}
                  >
                    <BrandTile name={item.BrandName} imageUri={item.BrandImage} index={0} />
                  </TouchableOpacity>
                )}
              />
            ) : !brandsError ? (
              <View style={[styles.brandsRail, { flexDirection: 'row' }]}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ alignItems: 'center', gap: Space[1] + 2, width: 72 }}>
                    <Skeleton width={64} height={64} radius={16} />
                    <Skeleton width={48} height={9} />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* 7. Collection — surface, horizontal rail */}
        {featuredCategoryProducts && featuredCategoryProducts.length > 0 && (
          <View style={styles.sectionSurface}>
            <ProductRail
              eyebrow="COLLECTION"
              title={featuredCategoryName ?? ''}
              items={featuredCategoryProducts}
              cardWidth={148}
              actionLabel="See all"
              onSeeAll={() => navigation.navigate('Result', { categoryName: featuredCategoryName ?? 'All Products' })}
              onPress={(itemId) => navigation.navigate('Product', { product: String(itemId) })}
              wishlistMap={wishlistMap}
            />
          </View>
        )}

        {/* 8. Recently viewed — surfaceSoft, only when there's enough history */}
        {recentlyViewed.length >= 2 && (
          <View style={styles.sectionSoft}>
            <ProductRail
              eyebrow="RECENTLY VIEWED"
              title="Continue browsing"
              items={recentlyViewed as unknown as ProductInterface[]}
              cardWidth={134}
              actionLabel="View all"
              onSeeAll={() => navigation.navigate('Result', { categoryName: 'Recently Viewed', itemIds: recentlyViewed.map(p => p.ItemID) })}
              secondaryAction="Clear"
              onSecondaryAction={clearRecentlyViewed}
              onPress={(itemId) => navigation.navigate('Product', { product: String(itemId) })}
              wishlistMap={wishlistMap}
            />
          </View>
        )}
      </ScrollView>

      {/* ── Scroll to top button ─────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]}
        pointerEvents={showScrollTop ? 'box-none' : 'none'}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          activeOpacity={0.85}
          style={styles.scrollTopInner}
        >
          <Icon name="arrow-up" size={14} color={Colors.ink2} />
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
};

export default HomeScreen;
