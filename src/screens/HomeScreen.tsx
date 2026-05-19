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
import { useAsyncState } from '../hooks/useAsyncState';
import { SearchBar, Skeleton, SkeletonRow, BottomNavBar } from '../components/ui';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H   = 300;
const BRIDGE_H = 80;

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
  const [searchQuery, setSearchQuery] = useState('');
  const heroImgOpacity = useRef(new Animated.Value(0)).current;

  const {
    data: categories,
    run: runCategories,
  } = useAsyncState<CategoryInterface[]>(null);

  const {
    data: products,
    run: runProducts,
  } = useAsyncState<ProductInterface[]>(null);

  const heroAnim  = useEntrance(60, true);
  const catAnim   = useEntrance(200);
  const featAnim  = useEntrance(300);
  const shelfAnim = useEntrance(380);
  const editAnim  = useEntrance(460);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      runCategories(() => getCategories().then((d) => d.result), cancelled);
      runProducts(() => getAllProducts().then((d) => d.result), cancelled);
      return () => { cancelled.current = true; };
    }, [runCategories, runProducts]),
  );

  const deduplicatedProducts = products
    ? Array.from(new Map(products.map((p) => [p.Item_Id, p])).values())
    : null;

  const featuredProduct = deduplicatedProducts?.[0] ?? null;
  const flashDealProducts = deduplicatedProducts
    ? deduplicatedProducts.filter((p, i) => i > 0 && p.ComparePrice > p.Price)
    : null;
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
    [navigation],
  );

  const renderCategory = useCallback(
    ({ item }: { item: CategoryInterface }) => (
      <CategoryItem
        category={item}
        onPress={() => navigation.navigate('Result', { categoryId: item.Category_Id, categoryName: item.CategoryName })}
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
            <View style={styles.heroInner}>
              {/* Text column */}
              <View style={styles.heroTextCol}>
                <Text style={styles.heroEyebrow}>NEW SEASON</Text>
                <Text style={styles.heroTitle} numberOfLines={3}>
                  {heroBanner.title}
                </Text>
                {/* Underline-text CTA — editorial, not pill */}
                <TouchableOpacity
                  style={styles.heroCTA}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Result', { flashDeals: true, categoryName: 'New In' })}
                >
                  <Text style={styles.heroCTAText}>Shop the edit</Text>
                </TouchableOpacity>
              </View>

              {/* Image column — bleeds to right edge */}
              <View style={styles.heroImgCol}>
                <Animated.Image
                  source={{ uri: heroBanner.images[0] }}
                  style={[styles.heroImg, { opacity: heroImgOpacity }]}
                  resizeMode="cover"
                  onLoad={handleHeroImageLoad}
                />
                {/* Left-edge veil blends image into dark bg */}
                <LinearGradient
                  colors={[Colors.ink1, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.32, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
              </View>
            </View>
          </View>

          {/* Tonal bridge: ink → surface */}
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
              keyExtractor={(item) => String(item.Category_Id)}
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
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.74)']}
                locations={[0, 0.2, 0.6, 1]}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Ember badge — replaces red danger chip */}
              {featuredProduct.ComparePrice > featuredProduct.Price && (
                <View style={styles.featBadge}>
                  <Text style={styles.featBadgeText}>
                    -{Math.round(((featuredProduct.ComparePrice - featuredProduct.Price) / featuredProduct.ComparePrice) * 100)}%
                  </Text>
                </View>
              )}

              <View style={styles.featFooter}>
                <View style={styles.featFooterLeft}>
                  {featuredProduct.Brand_Name ? (
                    <Text style={styles.featBrand}>{featuredProduct.Brand_Name}</Text>
                  ) : null}
                  <Text style={styles.featName} numberOfLines={1}>
                    {featuredProduct.Name}
                  </Text>
                  <View style={styles.featPriceRow}>
                    <Text style={styles.featPrice}>${featuredProduct.Price.toFixed(2)}</Text>
                    {featuredProduct.ComparePrice > featuredProduct.Price && (
                      <Text style={styles.featWas}>${featuredProduct.ComparePrice.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
                {/* Text-link CTA — no pill, more editorial */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Product', { product: featuredProduct.Inventory_Id })}
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

          {shelfProducts !== null ? (
            <FlatList
              data={shelfProducts}
              renderItem={renderProduct}
              keyExtractor={(item: ProductInterface) => String(item.Item_Id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRail}
              snapToInterval={180 + Space[4]}
              decelerationRate="fast"
            />
          ) : (
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
          )}
        </Animated.View>

        {/* ── Editorial card ─────────────────────────────────────────────── */}
        <Animated.View style={[styles.section, { marginBottom: Space[8] }, editAnim]}>
          <TouchableOpacity
            style={styles.editCard}
            activeOpacity={0.88}
            onPress={() =>
              categories?.[0] &&
              navigation.navigate('Result', { categoryId: categories[0].Category_Id })
            }
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
                source={{ uri: heroBanner.images[1] ?? heroBanner.images[0] }}
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

  // ── Sticky search band ──────────────────────────────────────────────────────
  searchBand: {
    backgroundColor:   Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[1],
    paddingBottom:     Space[3],
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroBg: {
    backgroundColor: Colors.ink1,
    height:          HERO_H,
    overflow:        'hidden',
  },
  heroInner: {
    flex:      1,
    flexDirection: 'row',
  },
  heroTextCol: {
    flex:            1,
    paddingLeft:     Space.screenH,
    paddingTop:      Space[6],
    paddingRight:    Space[2],
    justifyContent:  'center',
    gap:             Space[4],
  },
  heroEyebrow: {
    ...Type.label,
    color:         'rgba(255,255,255,0.32)',
    letterSpacing: 2.0,
  },
  // Serif italic display title — cinematic, not bold sans
  heroTitle: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      38,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -1.2,
    lineHeight:    40,
  },
  // Underline text CTA — editorial restraint, not an outlined pill
  heroCTA: {
    alignSelf: 'flex-start',
  },
  heroCTAText: {
    ...Type.bodyStrong,
    color:             'rgba(255,255,255,0.80)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.35)',
    paddingBottom:     2,
  },
  heroImgCol: {
    width:    SCREEN_W * 0.44,
    height:   HERO_H,
    position: 'relative',
  },
  heroImg: {
    width:  '100%',
    height: '100%',
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
