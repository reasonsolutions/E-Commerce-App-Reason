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
import { heroBanner } from '../data/mockData';
import CategoryItem from '../components/CategoryItem';
import ProductCard from '../components/ProductCard';
import { CategoryInterface, ProductInterface } from '../api/interfaces';
import { getAllProducts, getCategories } from '../api/services';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { SearchBar, Skeleton, SkeletonRow, BottomNavBar } from '../components/ui';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 300;
const BRIDGE_H = 100;

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  getState?: () => { routes: Array<{ name: string }> };
};
type HomeScreenProps = { navigation: NavigationProp };

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

  const { getCartItemsCount } = useCart();
  const cartItemsCount: number = getCartItemsCount();
  const [categories, setCategories]   = useState<CategoryInterface[] | null>(null);
  const [products, setProducts]       = useState<ProductInterface[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const heroImgOpacity = useRef(new Animated.Value(0)).current;

  const heroAnim  = useEntrance(60, true);  // scale materialisation on hero only
  const catAnim   = useEntrance(200);
  const featAnim  = useEntrance(300);
  const shelfAnim = useEntrance(380);
  const editAnim  = useEntrance(460);

  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d.result))
      .catch((e) => console.error('Error fetching categories:', e));
    getAllProducts()
      .then((d) => setProducts(d.result))
      .catch((e) => console.error('Error fetching products:', e));
  }, []);

  const deduplicatedProducts = products
    ? Array.from(new Map(products.map((p) => [p.Item_Id, p])).values())
    : null;

  const featuredProduct = deduplicatedProducts?.[0] ?? null;
  // Flash Deals: discounted products, excluding the featured slot
  const flashDealProducts = deduplicatedProducts
    ? deduplicatedProducts.filter((p, i) => i > 0 && p.ComparePrice > p.Price)
    : null;
  // Fallback: if no discounted products beyond featured, use all non-featured products
  const shelfProducts = flashDealProducts?.length
    ? flashDealProducts
    : (deduplicatedProducts?.slice(1) ?? null);

  const handleHeroImageLoad = useCallback(() => {
    Animated.timing(heroImgOpacity, {
      toValue: 1, duration: 900, useNativeDriver: true,
    }).start();
  }, [heroImgOpacity]);

  const renderProduct = useCallback(
    ({ item, index }: { item: ProductInterface; index: number }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('Product', { product: item.Inventory_Id })}
        tall={index === 0}
      />
    ),
    [navigation]
  );

  const renderCategory = useCallback(
    ({ item }: { item: CategoryInterface }) => (
      <CategoryItem
        category={item}
        onPress={() => navigation.navigate('Result', { categoryId: item.Category_Id, categoryName: item.CategoryName })}
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" translucent />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Space[1] }]}>
        <View style={styles.headerRow}>
          <Text style={styles.brandName}>shop.</Text>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => navigation.navigate('Cart')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="bag-outline" size={21} color="#FFFFFF" />
            {cartItemsCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemsCount > 99 ? '99+' : cartItemsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[0]}
      >
        {/* ── Sticky search band ─────────────────────────────────────────── */}
        <View style={styles.searchBand}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products, brands…"
          />
        </View>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <Animated.View style={heroAnim}>
          <View style={styles.heroBg}>
            <View style={styles.heroOrbLeft} />
            <View style={styles.heroOrbSeam} />

            <View style={styles.heroInner}>
              {/* Text column */}
              <View style={styles.heroTextCol}>
                <Text style={styles.heroEyebrow}>NEW SEASON · 26</Text>
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {heroBanner.title}
                </Text>
                {/* Ghost CTA — editorial restraint */}
                <TouchableOpacity style={styles.heroCTA} activeOpacity={0.7}>
                  <Text style={styles.heroCTAText}>Shop the edit</Text>
                  <Icon name="arrow-forward" size={11} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              {/* Image column — wider, bleeds to right edge */}
              <View style={styles.heroImgCol}>
                <Animated.Image
                  source={{ uri: heroBanner.images[0] }}
                  style={[styles.heroImg, { opacity: heroImgOpacity }]}
                  resizeMode="cover"
                  onLoad={handleHeroImageLoad}
                />
                {/* Gradient veil on left edge — blends image into dark bg */}
                <LinearGradient
                  colors={['#0A0A0A', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.28, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
              </View>
            </View>

          </View>

          {/* Tonal bridge: dark → surfaceAlt */}
          <LinearGradient
            colors={['#0A0A0A', Colors.surfaceAlt]}
            style={styles.tonalBridge}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
        </Animated.View>

        {/* ── Categories — floats in bridge zone ────────────────────────── */}
        <Animated.View style={[styles.catSection, catAnim]}>
          {categories ? (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={(item) => String(item.Category_Id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRail}
              nestedScrollEnabled
            />
          ) : (
            <View style={styles.categoryRail}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.catSkeletonCell}>
                  <Skeleton width={64} height={64} radius={Radius.pill} />
                  <Skeleton height={10} width={44} style={{ marginTop: Space[2] }} />
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Featured card ──────────────────────────────────────────────── */}
        {deduplicatedProducts !== null && featuredProduct && (
          <Animated.View style={[styles.section, featAnim]}>
            <TouchableOpacity
              style={styles.featCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Product', { product: featuredProduct.Inventory_Id })}
            >
              <Image
                source={{ uri: featuredProduct.Images?.split(';')[0] || '' }}
                style={styles.featImage}
                resizeMode="cover"
              />
              {/* Gradient starts at 15% transparent for more image presence */}
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.80)']}
                locations={[0, 0.15, 0.6, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              {featuredProduct.ComparePrice > featuredProduct.Price && (
                <View style={styles.featBadge}>
                  <Text style={styles.featBadgeText}>
                    {Math.round(((featuredProduct.ComparePrice - featuredProduct.Price) / featuredProduct.ComparePrice) * 100)}% OFF
                  </Text>
                </View>
              )}
              <View style={styles.featFooter}>
                <View style={styles.featFooterLeft}>
                  <Text style={styles.featBrand}>{featuredProduct.Brand_Name}</Text>
                  <Text style={styles.featName} numberOfLines={1}>{featuredProduct.Name}</Text>
                  <View style={styles.featPriceRow}>
                    <Text style={styles.featPrice}>${featuredProduct.Price.toFixed(2)}</Text>
                    {featuredProduct.ComparePrice > featuredProduct.Price && (
                      <Text style={styles.featWas}>${featuredProduct.ComparePrice.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.featViewBtn}>
                  <Text style={styles.featViewBtnText}>View</Text>
                  <Icon name="arrow-forward" size={11} color="#0A0A0A" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
        {deduplicatedProducts === null && (
          <View style={styles.section}>
            <Skeleton height={260} radius={Radius.lg} style={{ marginHorizontal: Space.screenH }} />
          </View>
        )}

        {/* ── Compositional breath between featured and shelf ────────────── */}
        <View style={styles.divider} />

        {/* ── Flash Deals shelf ──────────────────────────────────────────── */}
        <Animated.View style={[styles.shelfSection, shelfAnim]}>
          <View style={styles.shelfHead}>
            <Text style={styles.shelfTitle}>Flash Deals</Text>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() =>
                navigation.navigate('Result', {
                  flashDeals: true,
                  categoryName: 'Flash Deals',
                })
              }
            >
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {shelfProducts !== null ? (
            <FlatList
              data={shelfProducts}
              renderItem={renderProduct}
              keyExtractor={(item: ProductInterface) => String(item.Item_Id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRail}
              snapToInterval={180 + Space[3]}
              decelerationRate="fast"
            />
          ) : (
            <SkeletonRow gap={Space[3]} style={styles.shelfRail}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 160 }}>
                  <Skeleton height={i === 0 ? 200 : 160} radius={Radius.md} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={10} width="55%" style={{ marginBottom: Space[1] }} />
                  <Skeleton height={13} width="80%" style={{ marginBottom: Space[1] }} />
                  <Skeleton height={13} width="45%" />
                </View>
              ))}
            </SkeletonRow>
          )}
        </Animated.View>

        {/* ── Editorial break ────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { marginBottom: Space[8] }, editAnim]}>
          <View style={styles.editCard}>
            {/* Left text column */}
            <View style={styles.editLeft}>
              <Text style={styles.editEyebrow}>THE TECH EDIT</Text>
              <Text style={styles.editHeadline}>
                Everything{'\n'}you need.{'\n'}Nothing{'\n'}you don't.
              </Text>
              <TouchableOpacity
                style={styles.editCTA}
                activeOpacity={0.7}
                onPress={() =>
                  categories?.[0] &&
                  navigation.navigate('Result', { categoryId: categories[0].Category_Id })
                }
              >
                <Text style={styles.editCTAText}>Explore</Text>
                <Icon name="arrow-forward" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Right — single full-height image column */}
            <View style={styles.editImgCol}>
              <Image
                source={{ uri: heroBanner.images[1] ?? heroBanner.images[0] }}
                style={styles.editImg}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(10,10,10,0.4)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </View>
          </View>
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
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[3],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -1.2,
  },
  cartBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0A0A0A',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: FontWeight.bold,
    lineHeight: 11,
  },

  // ── Scroll ──────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
  },
  scrollContent: {
    paddingBottom: Space[10],
  },

  // ── Sticky search band ──────────────────────────────────────────────────
  searchBand: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingTop: Space[1],
    paddingBottom: Space[3],
  },

  // ── Hero ────────────────────────────────────────────────────────────────
  heroBg: {
    backgroundColor: '#0A0A0A',
    height: HERO_H,
    overflow: 'hidden',
  },
  heroOrbLeft: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6366F1',
    opacity: 0.12,
  },
  heroOrbSeam: {
    position: 'absolute',
    bottom: -20,
    left: SCREEN_W * 0.52,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#8B5CF6',
    opacity: 0.10,
  },
  heroInner: {
    flex: 1,
    flexDirection: 'row',
  },
  heroTextCol: {
    flex: 1,
    paddingLeft: Space.screenH,
    paddingTop: Space[5],
    paddingRight: Space[2],
    justifyContent: 'center',
    gap: Space[4],
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -1.6,
    lineHeight: 44,
  },
  // Ghost CTA — outline only, no fill. More editorial than solid pill.
  heroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: Radius.pill,
    paddingVertical: 9,
    paddingHorizontal: Space[4],
  },
  heroCTAText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.1,
  },
  heroImgCol: {
    width: SCREEN_W * 0.44,
    height: HERO_H,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  // Tonal bridge
  tonalBridge: {
    height: BRIDGE_H,
    marginTop: -1,
  },

  // ── Categories ──────────────────────────────────────────────────────────
  catSection: {
    marginTop: -(BRIDGE_H - Space[4]),
  },
  categoryRail: {
    paddingHorizontal: Space.screenH,
    gap: Space[5],
    flexDirection: 'row',
    paddingBottom: Space[2],
  },
  catSkeletonCell: {
    alignItems: 'center',
  },

  // ── Section shell ────────────────────────────────────────────────────────
  section: {
    marginTop: Space[8],
  },

  // ── Featured card ────────────────────────────────────────────────────────
  featCard: {
    marginHorizontal: Space.screenH,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    height: 260,
    backgroundColor: Colors.surfaceAlt,
    ...Shadow.lg,
  },
  featImage: {
    width: '100%',
    height: '100%',
  },
  featBadge: {
    position: 'absolute',
    top: Space[3],
    left: Space[3],
    backgroundColor: Colors.danger,
    borderRadius: Radius.xs,
    paddingVertical: 3,
    paddingHorizontal: Space[2],
  },
  featBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  featFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Space[4],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featFooterLeft: {
    flex: 1,
    gap: 3,
    paddingRight: Space[3],
  },
  featBrand: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  featName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  featPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    marginTop: 2,
  },
  featPrice: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  featWas: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  featViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Space[3],
  },
  featViewBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#0A0A0A',
  },

  // ── Compositional divider — editorial breath ──────────────────────────────
  divider: {
    marginHorizontal: Space.screenH,
    marginTop: Space[6],
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
  },

  // ── Flash Deals shelf ────────────────────────────────────────────────────
  shelfSection: {
    marginTop: Space[6],
  },
  shelfHead: {
    paddingHorizontal: Space.screenH,
    marginBottom: Space[4],
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  shelfTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: -0.9,
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink3,
  },
  shelfRail: {
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[1],
    gap: Space[3],
    alignItems: 'center',
  },

  // ── Editorial break ──────────────────────────────────────────────────────
  editCard: {
    marginHorizontal: Space.screenH,
    backgroundColor: '#0E0E0E',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    height: 240,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  editLeft: {
    flex: 1,
    padding: Space[5],
    justifyContent: 'space-between',
  },
  editEyebrow: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.6,
  },
  editHeadline: {
    fontSize: 24,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    lineHeight: 29,
    flex: 1,
    paddingTop: Space[3],
  },
  editCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.35)',
    paddingBottom: 3,
  },
  editCTAText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.1,
  },
  editImgCol: {
    width: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  editImg: {
    width: '100%',
    height: '100%',
  },
});

export default HomeScreen;
