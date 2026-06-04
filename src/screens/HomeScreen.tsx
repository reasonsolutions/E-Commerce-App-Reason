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
} from 'react-native';
import styles from './HomeScreen.styles';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import { CategoryInterface, ProductInterface, GetBrandItem } from '../api/interfaces';
import { getProductsByCategory, getCategories, getBrands } from '../api/product';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { clearSession } from '../utils/auth';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import {
  SearchBar, Skeleton, BottomNavBar,
  SectionHead, BrandTile, CategoryTile, ProductRail,
  TrustStrip, DeptFooter,
} from '../components/ui';
import { Colors, Space } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Discount helper — guard against inverted server DiscountPct ───────────────
function calcDiscount(price: number, comparePrice: number): number {
  if (comparePrice > price && price > 0) {
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }
  return 0;
}

// ── Recently viewed snapshot — only the fields ProductCard actually reads ────
interface RecentlyViewedItem {
  ItemID:          number;
  Name:            string;
  BrandName:       string;
  Images:          string;
  MinPrice:        number;
  MaxComparePrice: number;
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
    Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
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
      <LinearGradient
        colors={
          isEditorial
            ? ['rgba(18,15,12,0.92)', 'rgba(18,15,12,0.92)', 'rgba(18,15,12,0.25)']
            : ['rgba(18,15,12,0.05)', 'rgba(18,15,12,0.05)', 'rgba(18,15,12,0.82)']
        }
        locations={isEditorial ? [0, 0.38, 1] : [0, 0.30, 1]}
        start={{ x: isEditorial ? 0 : 0, y: isEditorial ? 0 : 0 }}
        end={{ x: isEditorial ? 1 : 0, y: isEditorial ? 0 : 1 }}
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
            <Icon name="arrow-forward" size={15} color={Colors.ink1} />
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
  const BANNER_H = 432;
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
            <View
              key={i}
              style={[styles.bannerDot, i === active && styles.bannerDotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ── Category spotlight card (EditFeature) ─────────────────────────────────────
const CategorySpotlightCard: React.FC<{
  category: CategoryInterface;
  onPress: () => void;
}> = ({ category, onPress }) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [imgOpacity]);
  const imgUri = resolveImageUrl(category.CategoryImage);

  return (
    <TouchableOpacity style={styles.spotCard} onPress={onPress} activeOpacity={0.88}>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.ink1 }]} />
      {imgUri ? (
        <Animated.Image
          source={{ uri: imgUri }}
          style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(18,15,12,0.82)', 'rgba(18,15,12,0.15)', 'rgba(18,15,12,0.80)']}
        locations={[0, 0.46, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.spotContent}>
        <Text style={styles.spotEyebrow}>SHOP THE CATEGORY</Text>
        <Text style={styles.spotTitle}>{category.CategoryName}</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.spotCtaWrap}>
          <View style={styles.spotCta}>
            <Text style={styles.spotCtaText}>Explore {category.CategoryName}</Text>
            <Icon name="arrow-forward" size={15} color={Colors.ink1} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Back-press / logout logic ─────────────────────────────────────────────────
type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  getState?: () => { routes: Array<{ name: string }> };
};

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


// Module-level cache — survives remounts within an app session
let _cachedProducts:   ProductInterface[]   | null = null;
let _cachedCategories: CategoryInterface[]  | null = null;
let _cachedBrands:     GetBrandItem[]       | null = null;

type HomeScreenProps = { navigation: NavigationProp };

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  useCustomBackHandler(navigation);
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  // ── Recently viewed ───────────────────────────────────────────────────────────
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  // ── Scroll to top ─────────────────────────────────────────────────────────────
  const scrollRef        = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShow = y > 300;
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
  const { data: categories, run: runCategories } = useAsyncState<CategoryInterface[]>(_cachedCategories);
  const { data: products,   run: runProducts   } = useAsyncState<ProductInterface[]>(_cachedProducts);
  const { data: brands,     run: runBrands     } = useAsyncState<GetBrandItem[]>(_cachedBrands);

  // Risk 2 fix: cartCount change only updates the cue, never re-fires API calls
  useEffect(() => {
    setShowResumeCue(cartCount > 0);
  }, [cartCount]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };

      // Always refresh recently viewed (cheap, local AsyncStorage read)
      AsyncStorage.getItem(STORAGE_KEYS.recentlyViewed).then(raw => {
        if (raw && !cancelled.current) {
          try { setRecentlyViewed(JSON.parse(raw)); } catch {}
        }
      });

      // Skip API fetches if data is already loaded — prevents flash on back navigation
      if (products && categories && brands) {
        return () => { cancelled.current = true; };
      }

      runCategories(async () => {
        const result = await getCategories().then((d) => d.result as CategoryInterface[]);
        _cachedCategories = result;
        return result;
      }, cancelled);

      runProducts(async () => {
        const catRes = await getCategories().then((d) => d.result as CategoryInterface[]);
        if (!catRes?.length) return [];
        const ids = catRes.slice(0, 4).map((c) => c.CategoryId);
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
        const list: GetBrandItem[] = (await getBrands())?.result ?? [];
        const result = list.slice(0, 8);
        _cachedBrands = result;
        return result;
      }, cancelled);

      return () => { cancelled.current = true; };
    }, [runCategories, runProducts, runBrands, products, categories, brands]),
  );

  // ── Derived data (memoised — recomputes only when source data changes) ────────
  const deduped = useMemo(
    () => products
      ? Array.from(new Map(products.filter(p => p.ItemID != null).map(p => [p.ItemID, p])).values())
      : null,
    [products],
  );

  const byCategory = useMemo(
    () => deduped
      ? deduped.reduce<Record<string, ProductInterface[]>>((acc, p) => {
          const key = p.CategoryName || 'Other';
          if (!acc[key]) acc[key] = [];
          acc[key].push(p);
          return acc;
        }, {})
      : null,
    [deduped],
  );

  const categoryRailKeys = useMemo(
    () => byCategory ? Object.keys(byCategory).slice(0, 2) : [],
    [byCategory],
  );

  const smartBuys = useMemo(
    () => deduped
      ? deduped.filter(p => p.MaxComparePrice > p.MinPrice && p.MinPrice > 0)
      : null,
    [deduped],
  );

  const spotlights: Spotlight[] | null = useMemo(() => {
    if (!deduped || !categories) return null;
    const result: Spotlight[] = [];
    const discounted = deduped.find(p => p.MaxComparePrice > p.MinPrice);
    if (discounted) {
      const pct = calcDiscount(discounted.MinPrice, discounted.MaxComparePrice);
      result.push({
        kind:     'product',
        eyebrow:  pct > 0 ? `${pct}% off · ${discounted.BrandName}` : discounted.BrandName,
        title:    discounted.Name,
        sub:      `Rs ${discounted.MinPrice.toLocaleString('en-IN')}  ·  was Rs ${discounted.MaxComparePrice.toLocaleString('en-IN')}`,
        cta:      'Shop now',
        imageUri: resolveImageUrl(discounted.Images),
        theme:    'photo',
        itemId:   discounted.ItemID,
      });
    } else if (deduped.length > 0) {
      const p = deduped[0];
      result.push({
        kind:     'product',
        eyebrow:  p.BrandName,
        title:    p.Name,
        sub:      `Rs ${p.MinPrice.toLocaleString('en-IN')}`,
        cta:      'Shop now',
        imageUri: resolveImageUrl(p.Images),
        theme:    'photo',
        itemId:   p.ItemID,
      });
    }
    const catWithImg = categories.find(c => c.CategoryImage);
    if (catWithImg) {
      result.push({
        kind:       'category',
        eyebrow:    'Shop the category',
        title:      catWithImg.CategoryName,
        sub:        `Browse all ${catWithImg.CategoryName}`,
        cta:        `Explore ${catWithImg.CategoryName}`,
        imageUri:   resolveImageUrl(catWithImg.CategoryImage),
        theme:      'split',
        categoryId: catWithImg.CategoryId,
      });
    }
    return result;
  }, [deduped, categories]);

  const featureCategory = useMemo(() => {
    if (!categories) return null;
    const spotlightCatId = spotlights?.find(s => s.kind === 'category')?.categoryId;
    return categories.find(c => c.CategoryImage && c.CategoryId !== spotlightCatId) ?? categories[0];
  }, [categories, spotlights]);

  const handleBannerPress = useCallback((spot: Spotlight) => {
    if (spot.kind === 'product' && spot.itemId) {
      navigation.navigate('Product', { product: spot.itemId });
    } else if (spot.kind === 'category' && spot.categoryId) {
      navigation.navigate('Result', { categoryId: spot.categoryId, categoryName: spot.title });
    }
  }, [navigation]);

  const clearRecentlyViewed = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.recentlyViewed);
    setRecentlyViewed([]);
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── TopBar ────────────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <Text style={styles.wordmark}>
            shop<Text style={styles.wordmarkDot}>.</Text>
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
      >
        {/* BannerSlot */}
        <View style={{ marginTop: Space[5] }}>
          <BannerSlot
            spots={spotlights}
            onPress={handleBannerPress}
          />
        </View>

        {/* Category rail */}
        <View style={{ marginTop: Space[6] }}>
          <SectionHead
            eyebrow="BROWSE"
            title="Categories"
            action="All"
            onAction={() => navigation.navigate('Result', { categoryName: 'All Products' })}
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
                  onPress={() => navigation.navigate('Result', { categoryId: item.CategoryId, categoryName: item.CategoryName })}
                />
              )}
            />
          ) : (
            <View style={styles.categoryRail}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ alignItems: 'center', gap: Space[2], width: 76 }}>
                  <Skeleton width={76} height={76} radius={20} />
                  <Skeleton width={50} height={9} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Category spotlight card */}
        {featureCategory ? (
          <View style={{ marginTop: Space[8], paddingHorizontal: Space.screenH }}>
            <CategorySpotlightCard
              category={featureCategory}
              onPress={() => navigation.navigate('Result', { categoryId: featureCategory.CategoryId, categoryName: featureCategory.CategoryName })}
            />
          </View>
        ) : categories === null ? (
          <View style={{ marginTop: Space[8], paddingHorizontal: Space.screenH }}>
            <Skeleton height={360} radius={22} />
          </View>
        ) : null}

        {/* First category product rail */}
        <View>
          {categoryRailKeys[0] ? (
            <ProductRail
              eyebrow="CATEGORY"
              title={categoryRailKeys[0]}
              items={byCategory?.[categoryRailKeys[0]] ?? null}
              onSeeAll={() => {
                const cat = categories?.find(c => c.CategoryName === categoryRailKeys[0]);
                navigation.navigate('Result', { categoryId: cat?.CategoryId, categoryName: categoryRailKeys[0] });
              }}
              onPress={(itemId) => navigation.navigate('Product', { product: itemId })}
            />
          ) : (
            <ProductRail
              title="Products"
              items={null}
              onPress={() => {}}
            />
          )}
        </View>

        {/* Brands rail */}
        <View style={{ marginTop: Space[8] }}>
          <SectionHead
            eyebrow="MERCHANTS"
            title="Brands"
            action="View all"
            onAction={() => navigation.navigate('Result', { categoryName: 'All Products' })}
          />
          {brands ? (
            <FlatList
              data={brands}
              keyExtractor={(item) => String(item.BrandId)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandsRail}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.brandChip}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('Result', { brandId: item.BrandId, categoryName: item.BrandName })}
                >
                  <BrandTile name={item.BrandName} imageUri={item.BrandImage} index={index} />
                  <Text style={styles.brandLabel} numberOfLines={1}>{item.BrandName}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.brandsRail}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ alignItems: 'center', gap: Space[2], width: 70 }}>
                  <Skeleton width={70} height={70} radius={35} />
                  <Skeleton width={48} height={9} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Second category product rail */}
        <View>
          {categoryRailKeys[1] ? (
            <ProductRail
              eyebrow="CATEGORY"
              title={categoryRailKeys[1]}
              items={byCategory?.[categoryRailKeys[1]] ?? null}
              onSeeAll={() => {
                const cat = categories?.find(c => c.CategoryName === categoryRailKeys[1]);
                navigation.navigate('Result', { categoryId: cat?.CategoryId, categoryName: categoryRailKeys[1] });
              }}
              onPress={(itemId) => navigation.navigate('Product', { product: itemId })}
            />
          ) : null}
        </View>

        {/* Recently viewed — client-side, hidden when empty */}
        {recentlyViewed.length > 0 && (
          <ProductRail
            eyebrow="WHERE YOU LEFT OFF"
            title="Recently viewed"
            items={recentlyViewed as unknown as ProductInterface[]}
            cardWidth={134}
            actionLabel="Clear"
            onSeeAll={clearRecentlyViewed}
            onPress={(itemId) => navigation.navigate('Product', { product: itemId })}
          />
        )}

        {/* Smart buys — products with a genuine discount */}
        {(smartBuys === null || (smartBuys && smartBuys.length > 0)) && (
          <ProductRail
            eyebrow="ON SALE"
            title="Smart buys"
            items={smartBuys}
            onSeeAll={() => navigation.navigate('Result', { categoryName: 'Deals' })}
            onPress={(itemId) => navigation.navigate('Product', { product: itemId })}
          />
        )}

        {/* Trust strip */}
        <TrustStrip />

        {/* Browse all departments footer */}
        <DeptFooter
          categoryCount={categories?.length ?? 0}
          onPress={() => navigation.navigate('Result', { categoryName: 'All Products' })}
        />
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
          <Icon name="arrow-up" size={18} color={Colors.ink1} />
        </TouchableOpacity>
      </Animated.View>

      <BottomNavBar
        activeTab="Home"
        onNavigate={(route) => navigation.navigate(route)}
        onNavigateToAuth={(screen) => navigation.navigate(screen)}
        cartCount={cartCount > 0 ? cartCount : undefined}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
