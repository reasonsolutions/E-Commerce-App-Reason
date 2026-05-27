import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  FlatList,
  Alert,
  BackHandler,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../context/CartContext';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import { CategoryInterface, ProductInterface, GetBrandItem } from '../api/interfaces';
import { getProductsByCategory, getCategories, getBrands } from '../api/product';
import { fallbackImageUrl } from '../utils/resolveImageUrl';
import { useProductImage } from '../hooks/useProductImage';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { useAsyncState } from '../hooks/useAsyncState';
import { SearchBar, Skeleton, SkeletonRow, BottomNavBar } from '../components/ui';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H   = Math.round(SCREEN_W * 1.18);
const BRIDGE_H = 64;

const BRAND_DOMAINS: Record<string, string> = {
  'nike':        'nike.com',
  'casio':       'casio.com',
  'van heusen':  'vanheusen.com',
  'allen solly': 'pvhcorp.com',
  'arrow':       'arrowshirts.com',
  'parle':       'parle.com',
  'lakme':       'lakmeindia.com',
  'fogg':        'vini.co.in',
  'crocs':       'crocs.com',
};

function brandFaviconUrl(brandName: string): string {
  const key    = brandName.toLowerCase().trim();
  const domain = BRAND_DOMAINS[key] ?? `${key.replace(/\s+/g, '')}.com`;
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=256`;
}

const FALLBACK_COLORS = [
  Colors.ink2, Colors.ink3, Colors.accent,
  Colors.ink1, Colors.ink3, Colors.ink2,
  Colors.accent, Colors.ink1,
];

// ── Brand tile: favicon with letter fallback ─────────────────────────────────
const BrandTile: React.FC<{ uri: string; name: string; fallbackColor: string }> = ({ uri, name, fallbackColor }) => {
  const [failed, setFailed] = useState(false);
  return (
    <View style={styles.brandLogoWrap}>
      {failed ? (
        <Text style={[styles.brandFallbackLetter, { color: fallbackColor }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <Image
          source={{ uri }}
          style={styles.brandLogo}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
};



// ── Hero slide — extracted so hooks can be called per item ───────────────────
const HeroSlide: React.FC<{ item: ProductInterface; onPress: (id: number) => void }> = ({ item, onPress }) => {
  const { uri, loading } = useProductImage(item.Name, item.BrandName, 'portrait');
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onImageLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = item.MaxComparePrice > item.MinPrice;
  const discountPct = hasDiscount
    ? Math.round(((item.MaxComparePrice - item.MinPrice) / item.MaxComparePrice) * 100)
    : 0;

  return (
    <TouchableOpacity style={styles.heroSlide} activeOpacity={0.97} onPress={() => onPress(item.ItemID)}>
      {/* Shimmer background while loading */}
      {loading && <Skeleton height={HERO_H} radius={0} style={StyleSheet.absoluteFillObject} />}
      {/* Fade in once URI is ready */}
      {uri ? (
        <Animated.Image
          source={{ uri }}
          style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onImageLoad}
        />
      ) : null}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.92)']}
        locations={[0.25, 0.52, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {hasDiscount && (
        <View style={styles.heroSlideBadge}>
          <Text style={styles.heroSlideBadgeText}>−{discountPct}%</Text>
        </View>
      )}
      <View style={styles.heroSlideFooter}>
        {item.BrandName ? (
          <Text style={styles.heroSlideBrand}>{item.BrandName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.heroSlideName} numberOfLines={2}>{item.Name}</Text>
        <View style={styles.heroSlidePriceRow}>
          {item.MinPrice > 0 && <Text style={styles.heroSlidePrice}>Rs {item.MinPrice.toFixed(0)}</Text>}
          {hasDiscount && <Text style={styles.heroSlidePriceWas}>Rs {item.MaxComparePrice.toFixed(0)}</Text>}
        </View>
        <View style={styles.heroSlideShopRow}>
          <Text style={styles.heroSlideShopText}>Shop now</Text>
          <Icon name="arrow-forward" size={13} color="rgba(255,255,255,0.75)" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Hero carousel ────────────────────────────────────────────────────────────
const HeroCarousel: React.FC<{
  products: ProductInterface[] | null;
  onPress: (itemId: number) => void;
}> = ({ products, onPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = products ?? [];

  const startAutoAdvance = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (slides.length < 2) return;
    autoTimer.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
  }, [slides.length]);

  useEffect(() => {
    startAutoAdvance();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [startAutoAdvance]);

  if (!products) {
    return <Skeleton height={HERO_H} radius={0} />;
  }

  if (slides.length === 0) {
    return <View style={[styles.heroBg, { height: HERO_H }]} />;
  }

  return (
    <View style={styles.heroBg}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => String(item.ItemID)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollBegin={() => {
          if (autoTimer.current) clearInterval(autoTimer.current);
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActiveIndex(idx);
          startAutoAdvance();
        }}
        renderItem={({ item }) => <HeroSlide item={item} onPress={onPress} />}
      />
      {slides.length > 1 && (
        <View style={styles.heroDots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.heroDot, i === activeIndex && styles.heroDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  getState?: () => { routes: Array<{ name: string }> };
};
type HomeScreenProps = { navigation: NavigationProp };

// ── Preserved verbatim — back-press / logout logic ───────────────────────────
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
                    await AsyncStorage.clear();
                    navigation.navigate('Login');
                  },
                },
              ],
              { cancelable: true }
            );
          }
        });
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => { subscription.remove(); };
    }, [navigation])
  );
}

// ── Preserved verbatim — local entrance hook (HomeScreen exception per CLAUDE.md) ──
// Durations (500ms/440ms) and initialY=14 are intentionally different from the
// shared useEntrance hook. Do not replace with the shared hook.
function useEntrance(delay = 0, withScale = false) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const scale      = useRef(new Animated.Value(withScale ? 0.97 : 1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: withScale ? 700 : 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 440, delay, useNativeDriver: true }),
      ...(withScale
        ? [Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true })]
        : []),
    ]).start();
  }, [opacity, translateY, scale, delay, withScale]);
  return { opacity, transform: withScale ? [{ translateY }, { scale }] : [{ translateY }] };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  useCustomBackHandler(navigation);
  const insets = useSafeAreaInsets();

  const { cartCount: cartItemsCount } = useCart();
  const [searchQuery, setSearchQuery]         = useState('');
  const [suggestions, setSuggestions]         = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
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
          discount: '%',
          pagination: { pageNumber: 1, pageSize: 6 },
        });
        const names: string[] = Array.from(
          new Set<string>(
            (response.data?.result?.Products ?? [])
              .map((p: any) => p.Name)
              .filter(Boolean),
          ),
        );
        setSuggestions(names);
        setShowSuggestions(names.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  const commitSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigation.navigate('Result', { searchQuery: q, categoryName: `"${q}"` });
  }, [navigation]);

  const {
    data: categories,
    run: runCategories,
  } = useAsyncState<CategoryInterface[]>(null);

  const {
    data: products,
    run: runProducts,
  } = useAsyncState<ProductInterface[]>(null);

  const {
    data: brands,
    run: runBrands,
  } = useAsyncState<GetBrandItem[]>(null);

  const heroAnim   = useEntrance(60, true);
  const catAnim    = useEntrance(200);
  const brandsAnim = useEntrance(260);
  const featAnim   = useEntrance(320);
  const shelfAnim  = useEntrance(400);
  const editAnim   = useEntrance(480);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      runCategories(() => getCategories().then((d) => d.result), cancelled);
      runProducts(async () => {
        const catRes = await getCategories().then((d) => d.result as CategoryInterface[]);
        if (!catRes?.length) return [];
        const ids = catRes.map((c) => c.CategoryId);
        const results = await Promise.all(ids.map((id) => getProductsByCategory(id, 1, 10).catch(() => [])));
        const merged = results.flat();
        const seen = new Set<number>();
        const deduped: ProductInterface[] = [];
        for (const p of merged) {
          if (!seen.has(p.Item_Id)) {
            seen.add(p.Item_Id);
            deduped.push({
              ItemID:          p.Item_Id,
              Name:            p.Name,
              Description:     p.Description,
              SubcategoryID:   String(p.SubCategory_Id),
              Images:          p.Images,
              CreatedDate:     p.Date_Created,
              BrandID:         String(p.Brand_Id),
              BrandName:       p.Brand_Name,
              SCName:          p.SCName,
              CategoryID:      String(p.Category_Id),
              CategoryName:    p.CategoryName,
              CategoryImage:   p.CategoryImage,
              MinPrice:        p.Price ?? 0,
              MaxComparePrice: p.ComparePrice ?? 0,
              Variants:        [],
            });
          }
        }
        return deduped;
      }, cancelled);
      runBrands(
        () => getBrands().then((d) => {
          const list: GetBrandItem[] = d?.result ?? [];
          return list.slice(0, 8);
        }),
        cancelled,
      );
      return () => { cancelled.current = true; };
    }, [runCategories, runProducts, runBrands]),
  );

  const deduplicatedProducts = products
    ? Array.from(new Map(products.filter(p => p.ItemID != null).map((p) => [p.ItemID, p])).values())
    : null;

  const featuredProduct = deduplicatedProducts?.[0] ?? null;
  const flashDealProducts = deduplicatedProducts
    ? deduplicatedProducts.filter((p, i) => i > 0 && p.MaxComparePrice > p.MinPrice)
    : null;
  const shelfProducts = flashDealProducts?.length
    ? flashDealProducts
    : (deduplicatedProducts?.slice(1) ?? null);

  const renderProduct = useCallback(
    ({ item, index }: { item: ProductInterface; index: number }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('Product', { product: item.ItemID })}
        tall={index === 0}
      />
    ),
    [navigation],
  );

  const renderCategory = useCallback(
    ({ item }: { item: CategoryInterface }) => (
      <CategoryItem
        category={item}
        onPress={() => navigation.navigate('Result', { categoryId: item.CategoryId, categoryName: item.CategoryName })}

      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Space[1] }]}>
        <View style={styles.headerRow}>
          {/* Wordmark — serifItalic to match Login brand identity */}
          <Text style={styles.brandName}>shop.</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.cartBtn}
          >
            <Icon name="bag-outline" size={22} color="#FFFFFF" />
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search band + dropdown — outside ScrollView so dropdown overlays content ── */}
      <View style={styles.searchBandWrap}>
        <View style={styles.searchBand}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search products, brands…"
            onSubmit={() => commitSearch(searchQuery)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
          />
        </View>
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionRow, i < suggestions.length - 1 && styles.suggestionDivider]}
                onPress={() => {
                  setSearchQuery(s);
                  commitSearch(s);
                }}
                activeOpacity={0.7}
              >
                <Icon name="search-outline" size={14} color={Colors.ink4} />
                <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Hero carousel ─────────────────────────────────────────────── */}
        <Animated.View style={heroAnim}>
          <HeroCarousel
            products={deduplicatedProducts?.slice(0, 5) ?? null}
            onPress={(itemId) => navigation.navigate('Product', { product: itemId })}
          />
          <LinearGradient
            colors={[Colors.ink1, Colors.surface]}
            style={styles.tonalBridge}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
        </Animated.View>

        {/* ── Categories ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.catSection, catAnim]}>
          {categories ? (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => String(item.CategoryId)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRail}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.categoryRail}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width={88} height={36} radius={Radius.pill} />
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Brands rail ────────────────────────────────────────────────── */}
        {brands && brands.length > 0 && (
          <Animated.View style={[styles.brandsSection, brandsAnim]}>
            <View style={styles.shelfHead}>
              <Text style={styles.shelfTitle}>Brands</Text>
            </View>
            <FlatList
              data={brands}
              keyExtractor={(item) => String(item.BrandId)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandsRail}
              renderItem={({ item, index }) => {
                const faviconUri = brandFaviconUrl(item.BrandName);
                const fallbackColor = FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                return (
                  <TouchableOpacity
                    style={styles.brandChip}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('Result', { brandId: item.BrandId, categoryName: item.BrandName })}
                  >
                    <BrandTile uri={faviconUri} name={item.BrandName} fallbackColor={fallbackColor} />
                    <Text style={styles.brandLabel} numberOfLines={1}>{item.BrandName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </Animated.View>
        )}

        {/* ── Featured card ──────────────────────────────────────────────── */}
        {deduplicatedProducts !== null && featuredProduct && (
          <Animated.View style={[styles.section, featAnim]}>
            <TouchableOpacity
              style={styles.featCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Product', { product: featuredProduct.ItemID })}
            >
              <Image
                source={{ uri: fallbackImageUrl(featuredProduct.ItemID + 100, 600, 520) }}
                style={styles.featImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.74)']}
                locations={[0, 0.2, 0.6, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Ember badge — replaces red danger chip */}
              {featuredProduct.MaxComparePrice > featuredProduct.MinPrice && (
                <View style={styles.featBadge}>
                  <Text style={styles.featBadgeText}>
                    -{Math.round(((featuredProduct.MaxComparePrice - featuredProduct.MinPrice) / featuredProduct.MaxComparePrice) * 100)}%
                  </Text>
                </View>
              )}

              <View style={styles.featFooter}>
                <View style={styles.featFooterLeft}>
                  {featuredProduct.BrandName ? (
                    <Text style={styles.featBrand}>{featuredProduct.BrandName}</Text>
                  ) : null}
                  <Text style={styles.featName} numberOfLines={1}>
                    {featuredProduct.Name}
                  </Text>
                  <View style={styles.featPriceRow}>
                    <Text style={styles.featPrice}>Rs {featuredProduct.MinPrice.toFixed(0)}</Text>
                    {featuredProduct.MaxComparePrice > featuredProduct.MinPrice && (
                      <Text style={styles.featWas}>Rs {featuredProduct.MaxComparePrice.toFixed(0)}</Text>
                    )}
                  </View>
                </View>
                {/* Text-link CTA — no pill, more editorial */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Product', { product: featuredProduct.ItemID })}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.featLink}>View →</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
        {deduplicatedProducts === null && (
          <View style={styles.section}>
            <Skeleton height={260} radius={Radius.lg} style={{ marginHorizontal: Space.screenH }} />
          </View>
        )}

        {/* ── Hairline divider ───────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Flash Deals shelf ──────────────────────────────────────────── */}
        <Animated.View style={[styles.shelfSection, shelfAnim]}>
          <View style={styles.shelfHead}>
            <Text style={styles.shelfTitle}>Flash Deals</Text>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => navigation.navigate('Result', { flashDeals: true, categoryName: 'Flash Deals' })}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {shelfProducts === null ? (
            <SkeletonRow gap={Space[4]} style={styles.shelfRail}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 180 }}>
                  <Skeleton height={i === 0 ? 200 : 164} radius={Radius.md} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={9}  width="50%" style={{ marginBottom: 4 }} />
                  <Skeleton height={12} width="78%" style={{ marginBottom: 4 }} />
                  <Skeleton height={12} width="42%" />
                </View>
              ))}
            </SkeletonRow>
          ) : shelfProducts.length === 0 ? (
            <View style={styles.shelfEmpty}>
              <Text style={styles.shelfEmptyText}>No deals right now.</Text>
            </View>
          ) : (
            <FlatList
              data={shelfProducts}
              renderItem={renderProduct}
              keyExtractor={(item: ProductInterface) => String(item.ItemID)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRail}
              snapToInterval={180 + Space[4]}
              decelerationRate="fast"
            />
          )}
        </Animated.View>

        {/* ── Editorial card ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { marginBottom: Space[8] }, editAnim]}>
          <TouchableOpacity
            style={styles.editCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Result', { categoryName: 'All Products' })}
          >
            {/* Left text column */}
            <View style={styles.editLeft}>
              <Text style={styles.editEyebrow}>THE EDIT</Text>
              <Text style={styles.editHeadline}>
                Everything{'\n'}you need.{'\n'}Nothing{'\n'}you don't.
              </Text>
              <Text style={styles.editCTA}>Explore →</Text>
            </View>

            {/* Right image column */}
            <View style={styles.editImgCol}>
              <Image
                source={{ uri: fallbackImageUrl((deduplicatedProducts?.[1]?.ItemID ?? deduplicatedProducts?.[0]?.ItemID ?? 99) + 200, 300, 440) }}
                style={styles.editImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(17,17,17,0.45)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <BottomNavBar
        activeTab="Home"
        onNavigate={(route) => navigation.navigate(route)}
        cartCount={cartItemsCount > 0 ? cartItemsCount : undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.ink1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[3],
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  // Serif italic wordmark — matches Login brand identity
  brandName: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      28,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.8,
  },
  cartBtn: {
    position: 'relative',
    padding:  4,
  },
  cartBadge: {
    position:          'absolute',
    top:               0,
    right:             0,
    backgroundColor:   Colors.accent,
    borderRadius:      Radius.pill,
    minWidth:          16,
    height:            16,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 3,
    borderWidth:       1.5,
    borderColor:       Colors.ink1,
  },
  cartBadgeText: {
    ...Type.label,
    color:         '#FFFFFF',
    letterSpacing: 0,
    fontSize:      9,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────────
  scroll: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingBottom: Space[10],
  },

  // ── Search band + dropdown ───────────────────────────────────────────────────
  searchBandWrap: {
    backgroundColor: Colors.ink1,
    zIndex:          20,
  },
  searchBand: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[1],
    paddingBottom:     Space[3],
  },
  suggestionBox: {
    position:         'absolute',
    top:              '100%',
    left:             Space.screenH,
    right:            Space.screenH,
    backgroundColor:  Colors.surface,
    borderRadius:     Radius.md,
    borderWidth:      StyleSheet.hairlineWidth,
    borderColor:      Colors.rule,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.10,
    shadowRadius:     12,
    elevation:        8,
    overflow:         'hidden',
    zIndex:           20,
  },
  suggestionRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
    paddingHorizontal: Space[4],
    paddingVertical:   Space[3] + 2,
  },
  suggestionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.rule,
  },
  suggestionText: {
    ...Type.body,
    color:   Colors.ink1,
    flex:    1,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroBg: {
    backgroundColor: Colors.ink1,
    height:          HERO_H,
    overflow:        'hidden',
  },
  // ── Carousel slide ────────────────────────────────────────────────────────────
  heroSlide: {
    width:           SCREEN_W,
    height:          HERO_H,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
  },
  heroSlideBadge: {
    position:          'absolute',
    top:               Space[4],
    left:              Space.screenH,
    backgroundColor:   Colors.accentTint,
    borderRadius:      Radius.xs,
    paddingVertical:   3,
    paddingHorizontal: Space[2],
    borderWidth:       0.5,
    borderColor:       Colors.accent,
  },
  heroSlideBadgeText: {
    ...Type.label,
    color:         Colors.accent,
    letterSpacing: 0.4,
  },
  heroSlideFooter: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[8],
  },
  heroSlideBrand: {
    ...Type.label,
    color:         'rgba(255,255,255,0.55)',
    letterSpacing: 1.8,
    marginBottom:  Space[1],
  },
  heroSlideName: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      32,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight:    38,
  },
  heroSlidePriceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2],
    marginTop:     4,
  },
  heroSlidePrice: {
    fontFamily:    FontFamily.serif,
    fontSize:      20,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSlidePriceWas: {
    fontFamily:         FontFamily.sans,
    fontSize:           13,
    color:              'rgba(255,255,255,0.45)',
    textDecorationLine: 'line-through',
  },
  heroSlideShopRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[1],
    marginTop:     Space[3],
  },
  heroSlideShopText: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '500',
    color:         'rgba(255,255,255,0.75)',
    letterSpacing: 0.2,
  },
  // ── Dot indicators ────────────────────────────────────────────────────────────
  heroDots: {
    position:       'absolute',
    bottom:         Space[3],
    left:           0,
    right:          0,
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            Space[1] + 2,
  },
  heroDot: {
    width:           5,
    height:          5,
    borderRadius:    3,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  heroDotActive: {
    width:           16,
    backgroundColor: '#FFFFFF',
  },
  tonalBridge: {
    height:    BRIDGE_H,
    marginTop: -1,
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  catSection: {
    // Float into the bridge gradient zone for visual continuity
    marginTop: -(BRIDGE_H - Space[4]),
  },
  categoryRail: {
    paddingHorizontal: Space.screenH,
    gap:               Space[2],
    flexDirection:     'row',
    paddingBottom:     Space[2],
  },

  // ── Section shell ────────────────────────────────────────────────────────────
  section: {
    marginTop: Space[8],
  },

  // ── Featured card ────────────────────────────────────────────────────────────
  featCard: {
    marginHorizontal: Space.screenH,
    borderRadius:     Radius.lg,
    overflow:         'hidden',
    height:           260,
    backgroundColor:  Colors.surfaceDeep,
    // No shadow — spec A3: depth through tone, not elevation
  },
  featImage: {
    width:  '100%',
    height: '100%',
  },
  featBadge: {
    position:          'absolute',
    top:               Space[3],
    left:              Space[3],
    backgroundColor:   Colors.accentTint,
    borderRadius:      Radius.xs,
    paddingVertical:   3,
    paddingHorizontal: Space[2],
    borderWidth:       0.5,
    borderColor:       Colors.accent,
  },
  featBadgeText: {
    ...Type.label,
    color:         Colors.accent,
    letterSpacing: 0.4,
    textTransform: 'none',
  },
  featFooter: {
    position:       'absolute',
    bottom:         0,
    left:           0,
    right:          0,
    padding:        Space[4],
    flexDirection:  'row',
    alignItems:     'flex-end',
    justifyContent: 'space-between',
  },
  featFooterLeft: {
    flex:         1,
    gap:          3,
    paddingRight: Space[3],
  },
  featBrand: {
    ...Type.label,
    color:         'rgba(255,255,255,0.50)',
    letterSpacing: 1.2,
  },
  featName: {
    fontFamily:    FontFamily.serif,
    fontSize:      18,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight:    22,
  },
  featPriceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    marginTop:     2,
  },
  featPrice: {
    fontFamily:    FontFamily.serif,
    fontSize:      17,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.3,
  },
  featWas: {
    ...Type.caption,
    color:              'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  // Text-link CTA — no pill
  featLink: {
    ...Type.bodyStrong,
    color:             'rgba(255,255,255,0.80)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.30)',
    paddingBottom:     1,
  },

  // ── Hairline divider ────────────────────────────────────────────────────────
  divider: {
    marginHorizontal: Space.screenH,
    marginTop:        Space[8],
    height:           StyleSheet.hairlineWidth,
    backgroundColor:  Colors.rule,
  },

  // ── Flash Deals shelf ────────────────────────────────────────────────────────
  shelfSection: {
    marginTop: Space[8],
  },
  shelfHead: {
    paddingHorizontal: Space.screenH,
    marginBottom:      Space[5],
    flexDirection:     'row',
    alignItems:        'baseline',
    justifyContent:    'space-between',
  },
  // Serif title per spec A7 section headers
  shelfTitle: {
    ...Type.title,
    color: Colors.ink1,
  },
  seeAll: {
    ...Type.caption,
    color:             Colors.ink3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.ink4,
    paddingBottom:     1,
  },
  shelfRail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[4],
    alignItems:        'flex-start',   // was 'center' — caused top-misaligned mixed heights
  },
  shelfEmpty: {
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[6],
  },
  shelfEmptyText: {
    ...Type.caption,
    color: Colors.ink4,
  },

  // ── Brands rail ─────────────────────────────────────────────────────────────
  brandsSection: {
    marginTop: Space[6],
  },
  brandsRail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    gap:               Space[3],
  },
  brandChip: {
    alignItems: 'center',
    width:      88,
    gap:        Space[2],
  },
  brandLogoWrap: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: '#FFFFFF',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.08,
    shadowRadius:    4,
    elevation:       2,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  brandLogo: {
    width:  56,
    height: 56,
  },
  brandLabel: {
    ...Type.caption,
    color:     Colors.ink2,
    textAlign: 'center',
  },
  brandFallbackLetter: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   28,
    lineHeight: 32,
  },

  // ── Editorial card ──────────────────────────────────────────────────────────
  editCard: {
    marginHorizontal: Space.screenH,
    backgroundColor:  Colors.ink1,
    borderRadius:     Radius.lg,
    flexDirection:    'row',
    height:           220,
    overflow:         'hidden',
    // No shadow — spec A3
  },
  editLeft: {
    flex:           1,
    padding:        Space[5],
    justifyContent: 'space-between',
  },
  editEyebrow: {
    ...Type.label,
    color:         'rgba(255,255,255,0.28)',
    letterSpacing: 1.8,
  },
  editHeadline: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      22,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight:    27,
    flex:          1,
    paddingTop:    Space[3],
  },
  editCTA: {
    ...Type.bodyStrong,
    color:             'rgba(255,255,255,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.28)',
    paddingBottom:     2,
    alignSelf:         'flex-start',
  },
  editImgCol: {
    width:    130,
    position: 'relative',
    overflow: 'hidden',
  },
  editImg: {
    width:  '100%',
    height: '100%',
  },
});

export default HomeScreen;
