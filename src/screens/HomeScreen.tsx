import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  BackHandler,
  Dimensions,
  Animated,
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import styles from './HomeScreen.styles';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import {
  CategoryInterface,
  ProductInterface,
  GetBrandItem,
} from '../api/interfaces';
import {
  getProductsByCategory,
  getCategories,
  getBrands,
} from '../api/product';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { clearSession } from '../utils/auth';
import { homeCache } from '../utils/homeCache';
import { wishlistCache } from '../utils/wishlistCache';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { BRAND } from '../config/brand';
import { useAsyncState } from '../hooks/useAsyncState';
import {
  SearchBar,
  Skeleton,
  SectionHead,
  BrandTile,
  CategoryTile,
  ProductRail,
  ProductGrid,
  WishlistHeart,
  // TrustStrip, — disabled, no longer required (see commented usage below)
} from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space } from '../theme';
import { Motion } from '../theme/motion';

const { width: SCREEN_W } = Dimensions.get('window');

// Category tile fixed width — circle 68px + label, 4-5 visible with a peek
const categoryTileW = 76;

// ── Recently viewed snapshot — only the fields ProductCard actually reads,
// plus CategoryName which backs the "Picked for you" personalization note.
interface RecentlyViewedItem {
  ItemID: number;
  Name: string;
  BrandName: string;
  Images: string;
  MinPrice: number;
  MaxComparePrice: number;
  DiscountPct?: number;
  Inventory_Id?: number | null;
  CategoryName?: string;
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
  inventoryId?: number;
  categoryId?: number;
  discountPct?: number;
  price?: number;
  comparePrice?: number;
  gradient: readonly [string, string];
}

// Per-category duotone gradient — gives each category its own hero identity
// instead of one fixed color for every slide. Curated palette (not derived
// from the product photo or an arbitrary hash-to-RGB — both risk a muddy/
// clashing pair). A hash picks each category's *preferred* theme, but two
// categories can hash to the same slot (e.g. "Wallet" and "Footwear" both
// landed on index 5 with only 6 themes) — assignHeroThemes below resolves
// that by walking forward to the next unclaimed theme, so distinct
// categories in the same active set never render identically as long as
// there are at least as many themes as categories on screen.
const HERO_THEMES: ReadonlyArray<{ gradient: readonly [string, string] }> = [
  { gradient: ['#8A6A4C', '#4E3A28'] }, // warm brown — leather/wallet goods
  { gradient: ['#5C5C63', '#26262B'] }, // graphite — tech/electronics
  { gradient: ['#EA9A4D', '#C6432D'] }, // orange/coral — footwear/sport
  { gradient: ['#9CB6C9', '#5B7A93'] }, // dusty blue — baby/soft goods
  { gradient: ['#B08BC7', '#5F3E76'] }, // plum — beauty/accessories
  { gradient: ['#7FA88C', '#3D5C46'] }, // sage — home/outdoors
  { gradient: ['#D98FA0', '#7A3C50'] }, // rose — apparel/lifestyle
  { gradient: ['#C9A24B', '#7A5A1E'] }, // gold/olive — jewelry/watches
  { gradient: ['#6E9BB8', '#2E4A5E'] }, // steel blue — sports/outdoor gear
  { gradient: ['#B5754F', '#5C3520'] }, // terracotta — furniture/decor
];
const HERO_THEME_DEFAULT = { gradient: ['#DD6B3B', '#E8794A'] as const };

// Simple deterministic string hash (djb2) — same category name always maps
// to the same preferred theme within a session and across app launches, so
// the hero doesn't flicker between colors for the same category on every
// refresh.
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33 + s.charCodeAt(i)) % 2147483647;
  }
  return h;
}

// Assigns one HERO_THEMES entry per category name in `categoryNames`, such
// that no two distinct names in the set share a theme (as long as
// categoryNames.length <= HERO_THEMES.length). Each name's hash picks its
// preferred slot; on collision, walks forward (wrapping) to the next slot
// not yet claimed by an earlier name in sorted order. Sorting first (rather
// than using array-encounter order) keeps the assignment stable regardless
// of what order spotlights happen to be built in.
function assignHeroThemes(
  categoryNames: readonly string[],
): Map<string, { gradient: readonly [string, string] }> {
  const uniqueSorted = Array.from(new Set(categoryNames)).sort();
  const claimed = new Set<number>();
  const result = new Map<string, { gradient: readonly [string, string] }>();
  for (const name of uniqueSorted) {
    const preferred = hashString(name) % HERO_THEMES.length;
    let slot = preferred;
    for (let attempts = 0; attempts < HERO_THEMES.length; attempts++) {
      if (!claimed.has(slot)) break;
      slot = (slot + 1) % HERO_THEMES.length;
    }
    claimed.add(slot);
    result.set(name, HERO_THEMES[slot]);
  }
  return result;
}

// ── Single banner card — per-category duotone, grounded product shot ────────────
// Each card gets its own gradient + plinth tint (mapped by real category, not
// one fixed color for every slide), a wishlist heart (product-sourced
// spotlights only — nothing to wishlist on the category-fallback path), an
// italic serif product title, a real price/compare-price row, and a
// translucent discount pill instead of a plain text line. The product photo
// sits on a grounded blurred-ellipse shadow rather than a boxed media card.
const BannerCard: React.FC<{
  spot: Spotlight;
  height: number;
  width: number;
  onPress: () => void;
}> = ({ spot, height, width, onPress }) => {
  const pct = spot.discountPct ? Math.round(spot.discountPct) : null;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Motion.easing.inOut,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Motion.easing.inOut,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const floatTranslateY = float.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, -4],
  });

  return (
    <TouchableOpacity
      style={{ height, width }}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <LinearGradient
        colors={[...spot.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bannerCard}
      >
        {/* Soft glow behind the header — integrates the card's own accent
            into the gradient instead of reading as a flat block. */}
        <View style={styles.bannerGlow} pointerEvents="none" />
        <View style={styles.bannerHeaderRow}>
          <Text style={styles.bannerEyebrow} numberOfLines={1}>
            {spot.eyebrow}
            {spot.sub ? ` · ${spot.sub}` : ''}
          </Text>
          {spot.inventoryId != null ? (
            <View style={styles.bannerWishlistWrap}>
              <WishlistHeart inventoryId={spot.inventoryId} />
            </View>
          ) : null}
        </View>
        <View style={styles.bannerBody}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerHeadline} numberOfLines={2}>
              {spot.title}
            </Text>
            {spot.price != null ? (
              <View style={styles.bannerPriceRow}>
                <Text style={styles.bannerPrice}>
                  MUR {spot.price.toLocaleString('en-IN')}
                </Text>
                {spot.comparePrice != null && spot.comparePrice > spot.price ? (
                  <Text style={styles.bannerComparePrice}>
                    MUR {spot.comparePrice.toLocaleString('en-IN')}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {pct !== null ? (
              <View style={styles.bannerDiscountPill}>
                <Text style={styles.bannerDiscountPillText}>{pct}% off</Text>
              </View>
            ) : null}
          </View>
          {/* Product photo floats directly on the card's own gradient — no
              boxed backdrop. Grounded by the soft shadow beneath it, same
              photo-first language as the category circles elsewhere on the
              page. */}
          <View style={styles.bannerPlinthCol}>
            <View style={styles.bannerGroundShadow} pointerEvents="none" />
            {spot.imageUri ? (
              <Animated.Image
                source={{ uri: spot.imageUri }}
                style={[
                  styles.bannerImg,
                  { transform: [{ translateY: floatTranslateY }] },
                ]}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
        <View style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>{spot.cta}</Text>
          <Icon name="arrow-forward" size={12} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Autoplay interval — long enough to read the headline/CTA before advancing.
const BANNER_AUTOPLAY_MS = 4500;

// ── BannerSlot — autoplay + manual swipe, full-bleed cards, dots below ──────────
// This app has a known issue (see HomeScreen's `scrollGen` remount trick for
// "scroll to top") where imperative ScrollView refs / Animated.Value-driven
// effects are silent no-ops on physical iPhone — confirmed again here across
// three different scroll APIs (FlatList.scrollToIndex, Animated.ScrollView
// .scrollTo, scrollResponderScrollTo), all accepted with no error but no
// visible movement. The proven fix elsewhere in this codebase is to avoid
// imperative refs entirely and drive position via a `key` remount instead —
// applied here: `key={active}` + declarative `contentOffset` forces the
// ScrollView to reinitialize at the target slide on every programmatic
// advance, with no ref/scrollTo call involved.
const BannerSlot: React.FC<{
  spots: Spotlight[] | null;
  onPress: (spot: Spotlight) => void;
}> = ({ spots, onPress }) => {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  // Bumped only on programmatic slide changes (autoplay tick, dot tap) — the
  // ScrollView remounts on this key to reliably move to the target slide (see
  // note above on why a ref-based scrollTo doesn't work here). Manual swipes
  // must NOT bump this: remounting on every swipe tears down and recreates
  // each BannerCard's Image, causing a visible blink/reload flash mid-gesture.
  const [remountKey, setRemountKey] = useState(0);
  const isFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);
  // Sized to fit the new header row (eyebrow + wishlist) + a fixed 142px
  // product plinth + CTA row + the card's own padding, without clipping the
  // plinth — taller than the previous compact layout since the plinth is a
  // fixed square rather than sharing a row with unconstrained text.
  const BANNER_H = 228;
  const CARD_W = SCREEN_W;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const goToSlide = useCallback((idx: number) => {
    activeRef.current = idx;
    setActive(idx);
    setRemountKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!spots || spots.length <= 1 || !isFocused || reduceMotion) return;
    const timer = setInterval(() => {
      goToSlide((activeRef.current + 1) % spots.length);
    }, BANNER_AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [spots, isFocused, reduceMotion, goToSlide]);

  if (spots === null) {
    return (
      <View style={styles.bannerSlot}>
        <View style={styles.bannerSkeletonWrap}>
          <Skeleton height={BANNER_H} radius={20} />
        </View>
      </View>
    );
  }

  if (spots.length === 0) return null;

  return (
    <View style={styles.bannerSlot}>
      <ScrollView
        key={remountKey}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: active * CARD_W, y: 0 }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
          const clamped = Math.min(idx, spots.length - 1);
          activeRef.current = clamped;
          setActive(clamped);
        }}
      >
        {spots.map((spot, i) => (
          <BannerCard
            key={i}
            spot={spot}
            height={BANNER_H}
            width={CARD_W}
            onPress={() => onPress(spot)}
          />
        ))}
      </ScrollView>
      {spots.length > 1 && (
        <View style={styles.bannerDots}>
          {spots.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => goToSlide(i)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${i + 1}`}
            >
              <View
                style={[
                  styles.bannerDot,
                  i === active && styles.bannerDotActive,
                ]}
              />
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
        const routeHistory = navigation?.getState?.()?.routes;
        const cameFromLogin =
          routeHistory &&
          routeHistory.length > 1 &&
          routeHistory[routeHistory.length - 2]?.name === 'Login';

        if (!cameFromLogin) return false; // let the OS handle it (exit app)

        AsyncStorage.getItem(STORAGE_KEYS.userData).then(user => {
          if (!user) return;
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
        });
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => {
        sub.remove();
      };
    }, [navigation]),
  );
}

// Module-level product cache — survives remounts within an app session
// categories + brands also written to homeCache so SearchScreen can read them
let _cachedProducts: ProductInterface[] | null = null;
let _cachedCategories: CategoryInterface[] | null = homeCache.categories;
let _cachedBrands: GetBrandItem[] | null = homeCache.brands;

type HomeScreenProps = { navigation: NavigationProp };

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  useCustomBackHandler(navigation);

  // Bottom-tab siblings (Orders/Wishlist/Profile) stay mounted at all times
  // and each render their own <StatusBar barStyle="dark-content">. RN merges
  // StatusBar state from every currently-mounted instance app-wide, so
  // whichever tab last asserted a style can win even after switching back to
  // Home — the declarative <StatusBar> below isn't reliably re-applied on
  // refocus by itself. Reassert imperatively every time Home regains focus.
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
    }, []),
  );

  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();
  const { refresh: refreshWishlist } = useWishlist();
  const wishlistFetchTime = useRef(0);

  // ── Recently viewed ───────────────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>(
    [],
  );

  // ── Scroll to top ─────────────────────────────────────────────────────────────
  // ScrollView's ref never resolves on some devices in this build (confirmed:
  // even a callback ref never fires on the ScrollView itself, while it fires
  // normally on a plain View) — scrollRef.current?.scrollTo() is a guaranteed
  // no-op there. Remounting via `key` instead: a fresh ScrollView always
  // starts at offset 0, sidestepping the ref entirely.
  const [scrollGen, setScrollGen] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  // Top bar leans out (shorter padding, smaller icon buttons) once the user
  // starts scrolling — settled back to full size near the very top.
  const topBarScrollY = useRef(new Animated.Value(0)).current;
  const topBarRowPadding = topBarScrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [2, 0],
    extrapolate: 'clamp',
  });
  const topBarIconSize = topBarScrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [34, 28],
    extrapolate: 'clamp',
  });

  const handleScroll = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      topBarScrollY.setValue(y);
      const shouldShow = y > 900;
      setShowScrollTop(prev => {
        if (prev !== shouldShow) {
          Animated.timing(scrollTopOpacity, {
            toValue: shouldShow ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        return shouldShow;
      });
    },
    [scrollTopOpacity, topBarScrollY],
  );

  const scrollToTop = useCallback(() => {
    setShowScrollTop(false);
    Animated.timing(scrollTopOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setScrollGen(g => g + 1);
  }, [scrollTopOpacity]);

  // ── Resume cart cue ───────────────────────────────────────────────────────────
  const [showResumeCue, setShowResumeCue] = useState(false);

  // ── Dynamic search reveal — icon toggles the search bar in/out ─────────────────
  const [searchOpen, setSearchOpen] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const toggleSearch = useCallback(() => {
    const next = !searchOpen;
    setSearchOpen(next);
    Animated.timing(searchAnim, {
      toValue: next ? 1 : 0,
      duration: Motion.duration.settle,
      easing: Motion.easing.out,
      useNativeDriver: false,
    }).start();
  }, [searchOpen, searchAnim]);

  // ── Data fetches — initialised from module-level cache so remounts show data instantly ──
  const {
    data: categories,
    run: runCategories,
    isError: categoriesError,
  } = useAsyncState<CategoryInterface[]>(_cachedCategories);
  const {
    data: products,
    run: runProducts,
    isError: productsError,
  } = useAsyncState<ProductInterface[]>(_cachedProducts);
  const {
    data: brands,
    run: runBrands,
    isError: brandsError,
  } = useAsyncState<GetBrandItem[]>(_cachedBrands);

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
      AsyncStorage.getItem(STORAGE_KEYS.userData)
        .then(userRaw => {
          const code: number | null = userRaw
            ? JSON.parse(userRaw).CustomerProfileCode ?? null
            : null;
          return AsyncStorage.getItem(scopedKey('recentlyViewed', code));
        })
        .then(raw => {
          if (raw && !cancelled.current) {
            try {
              setRecentlyViewed(JSON.parse(raw));
            } catch {}
          }
        })
        .catch(() => {});

      // Refresh wishlist map when cache is stale (invalidated by any mutation)
      const isWishlistStale =
        wishlistCache.lastFetchTime === 0 ||
        wishlistCache.lastFetchTime > wishlistFetchTime.current;
      if (isWishlistStale) {
        refreshWishlist()
          .then(() => {
            if (!cancelled.current) wishlistFetchTime.current = Date.now();
          })
          .catch(() => {});
      }

      // Skip if already fetching or if all data is cached — prevents re-firing on
      // focus events and prevents the dep-change loop (completed fetch changes state
      // → callback recreates → fetches restart → cancels previous in-flight results).
      if (
        fetchInitiated.current ||
        (_cachedCategories && _cachedProducts && _cachedBrands)
      ) {
        return () => {
          cancelled.current = true;
        };
      }

      fetchInitiated.current = true;

      // Fetch categories once and share the result with both the categories
      // state and the product-rail fetch, instead of calling getCategories() twice.
      const categoriesPromise = getCategories();

      runCategories(async () => {
        const res = await categoriesPromise;
        const result: CategoryInterface[] =
          res?.statusCode === 1 && Array.isArray(res.result?.Categories)
            ? res.result.Categories
            : [];
        _cachedCategories = result;
        homeCache.categories = result;
        return result;
      }, cancelled);

      runProducts(async () => {
        const catRes = await categoriesPromise;
        const cats: CategoryInterface[] =
          catRes?.statusCode === 1 && Array.isArray(catRes.result?.Categories)
            ? catRes.result.Categories
            : [];
        if (!cats.length) return [];
        const ids = cats.slice(0, 4).map(c => c.CategoryId);
        const results = await Promise.all(
          ids.map(id => getProductsByCategory(id, 1, 10).catch(() => [])),
        );
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
        const list: GetBrandItem[] = Array.isArray(res?.result?.Brands)
          ? res.result.Brands
          : [];
        const result = list.slice(0, 8);
        _cachedBrands = result;
        homeCache.brands = result;
        return result;
      }, cancelled);

      return () => {
        cancelled.current = true;
      };
    }, [runCategories, runProducts, runBrands, refreshWishlist]),
  );

  // ── Retry all fetches — clears module cache so useFocusEffect re-fires ──────────
  const handleRetryFeed = useCallback(() => {
    _cachedCategories = null;
    _cachedProducts = null;
    _cachedBrands = null;
    homeCache.categories = null;
    homeCache.brands = null;
    fetchInitiated.current = false;
    const cancelled = { current: false };
    const categoriesPromise = getCategories();
    runCategories(async () => {
      const res = await categoriesPromise;
      const result: CategoryInterface[] =
        res?.statusCode === 1 && Array.isArray(res.result?.Categories)
          ? res.result.Categories
          : [];
      _cachedCategories = result;
      homeCache.categories = result;
      return result;
    }, cancelled);
    runProducts(async () => {
      const catRes = await categoriesPromise;
      const cats: CategoryInterface[] =
        catRes?.statusCode === 1 && Array.isArray(catRes.result?.Categories)
          ? catRes.result.Categories
          : [];
      if (!cats.length) return [];
      const ids = cats.slice(0, 4).map(c => c.CategoryId);
      const results = await Promise.all(
        ids.map(id => getProductsByCategory(id, 1, 10).catch(() => [])),
      );
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
      const list: GetBrandItem[] = Array.isArray(res?.result?.Brands)
        ? res.result.Brands
        : [];
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
  const feedError =
    (categoriesError || productsError || brandsError) &&
    !categories &&
    !products &&
    !brands;

  // ── Derived data (memoised — recomputes only when source data changes) ────────
  const deduped = useMemo(
    () =>
      products
        ? Array.from(
            new Map(
              products.filter(p => p.ItemID != null).map(p => [p.ItemID, p]),
            ).values(),
          )
        : null,
    [products],
  );

  const smartBuys = useMemo(
    () =>
      deduped
        ? deduped.filter(p => p.MaxComparePrice > p.MinPrice && p.MinPrice > 0)
        : null,
    [deduped],
  );

  // New arrivals — sorted by CreatedDate, most recent first
  const newArrivals = useMemo(
    () =>
      deduped
        ? [...deduped].sort(
            (a, b) =>
              new Date(b.CreatedDate).getTime() -
              new Date(a.CreatedDate).getTime(),
          )
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
      if (count > bestCount) {
        best = name;
        bestCount = count;
      }
    }
    return bestCount >= 3 ? best : null;
  }, [deduped]);

  const featuredCategoryProducts = useMemo(
    () =>
      deduped && featuredCategoryName
        ? deduped.filter(p => p.CategoryName === featuredCategoryName)
        : null,
    [deduped, featuredCategoryName],
  );

  // Picked for you — top categories the user has actually viewed (by
  // CategoryName frequency in recentlyViewed), used both to filter a
  // personalized rail from the existing product pool and to build a real
  // "because you've been exploring…" note. Requires at least 2 distinct
  // categories of real signal — otherwise the section stays hidden rather
  // than showing weak/empty personalization.
  const pickedForYouCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of recentlyViewed) {
      if (!item.CategoryName) continue;
      counts.set(item.CategoryName, (counts.get(item.CategoryName) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
  }, [recentlyViewed]);

  const pickedForYouProducts = useMemo(() => {
    if (!deduped || pickedForYouCategories.length < 2) return null;
    const viewedIds = new Set(recentlyViewed.map(item => item.ItemID));
    const categorySet = new Set(pickedForYouCategories);
    return deduped.filter(
      p =>
        p.CategoryName &&
        categorySet.has(p.CategoryName) &&
        !viewedIds.has(p.ItemID),
    );
  }, [deduped, pickedForYouCategories, recentlyViewed]);

  // Note copy is derived from the categories actually present in
  // pickedForYouProducts — not from raw recentlyViewed history — so it never
  // names a category the rail ends up with zero products for (the Home feed's
  // fetched product pool only covers a handful of categories, which may not
  // overlap with everything the user has ever viewed).
  const pickedForYouNote = useMemo(() => {
    if (!pickedForYouProducts || pickedForYouProducts.length === 0) return null;
    const namesInOrder = pickedForYouCategories.filter(name =>
      pickedForYouProducts.some(p => p.CategoryName === name),
    );
    if (namesInOrder.length < 2) return null;
    const joined =
      namesInOrder.length === 2
        ? `${namesInOrder[0]} & ${namesInOrder[1]}`
        : `${namesInOrder.slice(0, -1).join(', ')} & ${
            namesInOrder[namesInOrder.length - 1]
          }`;
    return `Because you've been exploring ${joined}`;
  }, [pickedForYouCategories, pickedForYouProducts]);

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
      .slice(0, 4);

    if (topProducts.length > 0) {
      // Assign themes across this batch together so two categories in the
      // same carousel (e.g. Wallet + Footwear) never collide onto the same
      // color, even if their individual hashes would prefer the same slot.
      const themeByCategory = assignHeroThemes(
        topProducts.map(p => p.CategoryName ?? ''),
      );
      return topProducts.map(p => {
        const themed = themeByCategory.get(p.CategoryName ?? '') ?? HERO_THEME_DEFAULT;
        return {
          kind: 'product' as const,
          eyebrow: p.BrandName.toUpperCase(),
          // Product name, not brand — brand is already the eyebrow, so
          // repeating it as the headline says nothing new.
          title: p.Name,
          sub: p.CategoryName ?? '',
          cta: 'Shop the drop',
          imageUri: resolveImageUrl(p.Images),
          theme: 'split' as const,
          itemId: p.ItemID,
          inventoryId: p.Inventory_Id,
          discountPct: p.DiscountPct,
          price: p.MinPrice,
          comparePrice: p.MaxComparePrice,
          gradient: themed.gradient,
        };
      });
    }

    // Fallback — no discounted products yet, use category banners
    if (!categories) return null;
    const fallbackCategories = categories.filter(c => c.CategoryImage).slice(0, 4);
    const themeByCategory = assignHeroThemes(
      fallbackCategories.map(c => c.CategoryName),
    );
    return fallbackCategories.map(c => {
      const themed = themeByCategory.get(c.CategoryName) ?? HERO_THEME_DEFAULT;
      return {
        kind: 'category' as const,
        eyebrow: 'EXPLORE',
        title: c.CategoryName,
        sub: `Browse all ${c.CategoryName}`,
        cta: `Explore ${c.CategoryName}`,
        imageUri: resolveImageUrl(c.CategoryImage),
        theme: 'split' as const,
        categoryId: c.CategoryId,
        gradient: themed.gradient,
      };
    });
  }, [deduped, categories]);

  const handleBannerPress = useCallback(
    (spot: Spotlight) => {
      if (spot.kind === 'product' && spot.itemId) {
        navigation.navigate('Product', { product: String(spot.itemId) });
      } else if (spot.kind === 'category' && spot.categoryId) {
        navigation.navigate('Result', {
          categoryId: String(spot.categoryId),
          categoryName: spot.title,
        });
      }
    },
    [navigation],
  );

  const clearRecentlyViewed = useCallback(async () => {
    const userRaw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
    const code: number | null = userRaw
      ? JSON.parse(userRaw).CustomerProfileCode ?? null
      : null;
    await AsyncStorage.removeItem(scopedKey('recentlyViewed', code));
    setRecentlyViewed([]);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.heroStageStart}
      />

      {/* ── Fixed nav bar — wordmark + icons only, stays pinned like the original nav ── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Animated.View
          style={[
            styles.topBarRow,
            { paddingTop: topBarRowPadding, paddingBottom: topBarRowPadding },
          ]}
        >
          <Text style={styles.wordmark}>
            {BRAND.name}
            <Text style={styles.wordmarkDot}>.</Text>
          </Text>
          <View style={styles.topBarIcons}>
            <TouchableOpacity
              onPress={toggleSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View
                style={[
                  styles.iconBtn,
                  { width: topBarIconSize, height: topBarIconSize },
                ]}
              >
                <Icon
                  name={searchOpen ? 'close-outline' : 'search-outline'}
                  size={19}
                  color="#FFFFFF"
                />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Wishlist')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View
                style={[
                  styles.iconBtn,
                  { width: topBarIconSize, height: topBarIconSize },
                ]}
              >
                <Icon name="heart-outline" size={19} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View
                style={[
                  styles.iconBtn,
                  { width: topBarIconSize, height: topBarIconSize },
                ]}
              >
                <Icon name="bag-outline" size={19} color="#FFFFFF" />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        {/* Search bar — dynamically revealed by the search icon, tapping navigates to SearchScreen */}
        {searchOpen && (
          <Animated.View
            style={[
              styles.searchWrap,
              {
                opacity: searchAnim,
                transform: [
                  {
                    translateY: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <SearchBar
              value=""
              onChangeText={() => {}}
              placeholder="Search products, brands…"
              editable={false}
              onPress={() => navigation.navigate('Search')}
            />
          </Animated.View>
        )}
      </View>

      {/* Resume cart cue — normal page surface, below the fixed nav bar */}
      {showResumeCue && cartCount > 0 && (
        <TouchableOpacity
          style={styles.resumeCue}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.85}
        >
          <View style={styles.resumeLeft}>
            <Icon name="bag-outline" size={16} color={Colors.accent} />
            <Text style={styles.resumeText}>
              {cartCount} {cartCount === 1 ? 'item' : 'items'} waiting in your
              bag
            </Text>
          </View>
          <View style={styles.resumeRight}>
            <Text style={styles.resumeAction}>Resume</Text>
            <Icon name="arrow-forward" size={14} color={Colors.accent} />
          </View>
        </TouchableOpacity>
      )}

      {/* Pull-to-refresh backing — the gap revealed above the ScrollView's
          content while pulling down would otherwise show the page's cream
          background before the blue hero gradient scrolls into place. This
          sits behind the ScrollView, colored to match the hero, so the pull
          gap reads as a seamless continuation of the gradient instead of a
          white flash. Bottom overscroll is unaffected — it's absolutely
          positioned only behind the top of the screen. */}
      <View style={styles.pullBacking} pointerEvents="none" />

      {/* ── Scrollable content ────────────────────────────────────────────────── */}
      <ScrollView
        key={scrollGen}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Feed error */}
        {feedError ? (
          <ErrorState
            title="Feed didn't load."
            message="Check your connection and try again."
            onRetry={handleRetryFeed}
            retryLoading={
              categoriesError &&
              productsError &&
              brandsError &&
              !categories &&
              !products &&
              !brands
            }
          />
        ) : null}
        {/* Hero stage — categories + hero carousel share one gradient backdrop,
            scrolls away with the rest of the page */}
        {!feedError && (
          <LinearGradient
            colors={[Colors.heroStageStart, Colors.heroStageEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={styles.heroStage}
          >
            <View style={styles.categoryRailWrap}>
              <View style={styles.categoryRailHead}>
                <Text style={styles.categoryRailEyebrow}>SHOP BY CATEGORY</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Categories')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.categoryRailAction}>All</Text>
                </TouchableOpacity>
              </View>
              {categories ? (
                <FlatList
                  data={categories}
                  keyExtractor={item => String(item.CategoryId)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryRail}
                  renderItem={({ item, index }) => (
                    <CategoryTile
                      name={item.CategoryName}
                      imageUri={item.CategoryImage}
                      index={index}
                      width={categoryTileW}
                      onPress={() =>
                        navigation.navigate('Result', {
                          categoryId: String(item.CategoryId),
                          categoryName: item.CategoryName,
                        })
                      }
                    />
                  )}
                />
              ) : !categoriesError ? (
                <View style={styles.categoryRailSkeleton}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <View
                      key={i}
                      style={{
                        alignItems: 'center',
                        gap: Space[2],
                        width: categoryTileW,
                      }}
                    >
                      <Skeleton width={68} height={68} radius={34} />
                      <Skeleton width={48} height={9} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Hero — integrated into the same dark masthead as the logo,
                category row, and search bar, not a separate floating card
                with margin/gap around it. */}
            <BannerSlot spots={spotlights} onPress={handleBannerPress} />
          </LinearGradient>
        )}

        {/* Trust signals — horizontal single-row strip (disabled, no longer required) */}
        {/* {!feedError && <TrustStrip />} */}
        {/* 1. New arrivals — cream, horizontal rail */}
        {(newArrivals === null || (newArrivals && newArrivals.length > 0)) && (
          <View style={styles.sectionSurface}>
            <ProductRail
              eyebrow="JUST IN"
              title="New arrivals"
              items={newArrivals}
              cardWidth={148}
              actionLabel="See all"
              onSeeAll={() =>
                navigation.navigate('Result', { categoryName: 'New Arrivals' })
              }
              onPress={itemId =>
                navigation.navigate('Product', { product: String(itemId) })
              }
            />
          </View>
        )}
        {/* 2. Picked for you — peach ember tint, only with real category signal */}
        {pickedForYouProducts && pickedForYouProducts.length > 0 && (
          <View style={styles.sectionPeach}>
            <ProductRail
              eyebrow="FOR YOU"
              title="Picked for you"
              note={pickedForYouNote ?? undefined}
              items={pickedForYouProducts}
              cardWidth={148}
              actionLabel="See all"
              showQuickAdd
              onSeeAll={() =>
                navigation.navigate('Result', {
                  categoryName: 'Picked For You',
                  itemIds: pickedForYouProducts.map(p => p.ItemID),
                })
              }
              onPress={itemId =>
                navigation.navigate('Product', { product: String(itemId) })
              }
            />
          </View>
        )}
        {/* 3. Best deals — tinted band, 2-col grid */}
        {(smartBuys === null || (smartBuys && smartBuys.length > 0)) && (
          <View style={styles.sectionDeep}>
            <ProductGrid
              eyebrow="ON SALE"
              title="Best deals"
              items={smartBuys}
              onSeeAll={() =>
                navigation.navigate('Result', { categoryName: 'Deals' })
              }
              onPress={itemId =>
                navigation.navigate('Product', { product: String(itemId) })
              }
            />
          </View>
        )}
        {/* 4. Collection — tinted band, horizontal rail */}
        {featuredCategoryProducts && featuredCategoryProducts.length > 0 && (
          <View style={styles.sectionDeep}>
            <ProductRail
              eyebrow="COLLECTION"
              title={featuredCategoryName ?? ''}
              items={featuredCategoryProducts}
              cardWidth={148}
              actionLabel="See all"
              onSeeAll={() =>
                navigation.navigate('Result', {
                  categoryName: featuredCategoryName ?? 'All Products',
                })
              }
              onPress={itemId =>
                navigation.navigate('Product', { product: String(itemId) })
              }
            />
          </View>
        )}
        {/* 5. Brands — surfaceSoft, breaks rhythm after the grid */}
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
                keyExtractor={item => String(item.BrandId)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsRail}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() =>
                      navigation.navigate('Result', {
                        brandId: item.BrandId,
                        categoryName: item.BrandName,
                      })
                    }
                  >
                    <BrandTile
                      name={item.BrandName}
                      imageUri={item.BrandImage}
                      index={0}
                    />
                  </TouchableOpacity>
                )}
              />
            ) : !brandsError ? (
              <View style={[styles.brandsRail, { flexDirection: 'row' }]}>
                {[0, 1, 2, 3, 4, 5].map(i => (
                  <View
                    key={i}
                    style={{
                      alignItems: 'center',
                      gap: Space[1] + 2,
                      width: 72,
                    }}
                  >
                    <Skeleton width={64} height={64} radius={16} />
                    <Skeleton width={48} height={9} />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
        {/* 6. Recently viewed — cream, only when there's enough history */}
        {recentlyViewed.length >= 2 && (
          <View style={styles.sectionSoft}>
            <ProductRail
              eyebrow="RECENTLY VIEWED"
              title="Continue browsing"
              items={recentlyViewed as unknown as ProductInterface[]}
              cardWidth={134}
              actionLabel="View all"
              onSeeAll={() =>
                navigation.navigate('Result', {
                  categoryName: 'Recently Viewed',
                  itemIds: recentlyViewed.map(p => p.ItemID),
                })
              }
              secondaryAction="Clear"
              onSecondaryAction={clearRecentlyViewed}
              onPress={itemId =>
                navigation.navigate('Product', { product: String(itemId) })
              }
            />
          </View>
        )}
      </ScrollView>

      {/* ── Scroll to top button ─────────────────────────────────────────────── */}
      {/* bottom offset clears the bottom tab bar (rendered by the navigator,
          outside this screen) — a fixed offset left it sitting underneath
          the tab bar's view, silently eating taps despite being visible. */}
      <Animated.View
        style={[
          styles.scrollTopBtn,
          { bottom: insets.bottom + 72, opacity: scrollTopOpacity },
        ]}
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
