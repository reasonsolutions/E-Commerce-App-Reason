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
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { ProductDetailInterface, VariantInterface, PostCartSaveInterface } from '../api/interfaces';
import { postSaveCartItems, selectProduct, addToWishlist, removeFromWishlist, getWishlist } from '../api/services';
import { QuantityStepper, Skeleton, SkeletonRow, ErrorBanner } from '../components/ui';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Hero occupies 55% of screen height — image-first, cinematic
const HERO_H = Math.round(SCREEN_H * 0.55);

type ProductFetch = {
  product: ProductDetailInterface;
  variants: VariantInterface[];
};

type ProductScreenProps = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
  };
  route: {
    params?: {
      product?: string;
    };
  };
};

const ProductScreen: React.FC<ProductScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [wishlistItemCode, setWishlistItemCode] = useState<number | null>(null);

  // Entrance animation for content below hero
  const contentOpacity   = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  // Hero image fade-in
  const heroImgOpacity = useRef(new Animated.Value(0)).current;

  const { data, isError, error, run } = useAsyncState<ProductFetch>(null);

  const fetchProduct = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const res = await selectProduct(route?.params?.product ?? '1');
        return { product: res.result[0], variants: res.result[1] };
      }, cancelled),
    [run, route?.params?.product],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchProduct(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchProduct]);

  // Staggered content reveal fires once fetch succeeds
  useEffect(() => {
    if (!data) return;
    Animated.parallel([
      Animated.timing(contentOpacity,    { toValue: 1, duration: 480, delay: 80, useNativeDriver: true }),
      Animated.timing(contentTranslateY, { toValue: 0, duration: 420, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [data, contentOpacity, contentTranslateY]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(userData => {
      if (cancelled || !userData) return;
      const user = JSON.parse(userData);
      setProfileCode(user.CustomerProfileCode);
      // Check if this product is already wishlisted
      getWishlist(user.CustomerProfileCode).then(res => {
        if (cancelled) return;
        if (res.statusCode === 1) {
          const inventoryId = Number(route?.params?.product ?? 0);
          const match = (res.result || []).find((w: any) => w.Inventory_Id === inventoryId);
          if (match) {
            setWishlisted(true);
            setWishlistItemCode(match.WishlistItemCode);
          }
        }
      }).catch(() => {});
    }).catch(err => { if (!cancelled) console.error('Error fetching user data:', err); });
    return () => { cancelled = true; };
  }, []);

  const handleHeroImageLoad = useCallback(() => {
    Animated.timing(heroImgOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, [heroImgOpacity]);

  const handleAddToCart = async () => {
    const requestbody: PostCartSaveInterface = {
      CustomerLoginCode: null,
      CustomerProfileCode: profileCode!,
      Inventory_Id: selectedVariant
        ? parseInt(selectedVariant)
        : (data?.product?.Inventory_Id ?? 0),
      BranchCode: null,
      CountryCode: null,
      Quantity: quantity,
      SpecialRemarks: '',
    };
    try {
      await postSaveCartItems(requestbody);
      setCartCount((prev: number) => prev + quantity);
      navigation.navigate('Cart');
    } catch (err) {
      console.error('Error adding to cart: ', err);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
  };

  const handleWishlistToggle = async () => {
    if (!profileCode) return;
    const inventoryId = Number(route?.params?.product ?? 0);
    if (wishlisted && wishlistItemCode !== null) {
      await removeFromWishlist(profileCode, wishlistItemCode).catch(() => {});
      setWishlisted(false);
      setWishlistItemCode(null);
    } else {
      const res = await addToWishlist(profileCode, inventoryId).catch(() => null);
      if (res?.statusCode === 1) {
        // Re-fetch to get the assigned WishlistItemCode
        getWishlist(profileCode).then(wRes => {
          if (wRes.statusCode === 1) {
            const match = (wRes.result || []).find((w: any) => w.Inventory_Id === inventoryId);
            if (match) setWishlistItemCode(match.WishlistItemCode);
          }
        }).catch(() => {});
        setWishlisted(true);
      }
    }
  };

  const productDetails = data?.product ?? null;
  const variantDetails = data?.variants ?? [];

  const imageUri = productDetails?.Images
    ? productDetails.Images.split(';')[selectedImageIndex]
    : undefined;

  const imageThumbs = productDetails?.Images
    ? productDetails.Images.split(';').filter(Boolean)
    : [];

  const hasDiscount = productDetails
    ? productDetails.ComparePrice > productDetails.Price
    : false;
  const discountPct = hasDiscount && productDetails
    ? Math.round(((productDetails.ComparePrice - productDetails.Price) / productDetails.ComparePrice) * 100)
    : 0;

  const renderThumb = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[styles.thumb, selectedImageIndex === index && styles.thumbActive]}
      onPress={() => setSelectedImageIndex(index)}
      activeOpacity={0.75}
    >
      <Image source={{ uri: item }} style={styles.thumbImg} resizeMode="cover" />
      {selectedImageIndex === index && <View style={styles.thumbActiveLine} />}
    </TouchableOpacity>
  ), [selectedImageIndex]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {isError ? (
        <View style={[styles.errorWrap, { paddingTop: insets.top + Space[12] }]}>
          {/* Back button in error state */}
          <TouchableOpacity
            style={[styles.floatingBack, { top: insets.top + Space[2] }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={20} color={Colors.ink1} />
          </TouchableOpacity>
          <ErrorBanner
            title="Couldn't load product"
            body={error ?? 'Check your connection and try again.'}
            onRetry={() => fetchProduct()}
          />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ── HERO — full-bleed cinematic image ─────────────────────── */}
            <View style={[styles.hero, { height: HERO_H }]}>
              {productDetails ? (
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={[styles.heroImg, { opacity: heroImgOpacity }]}
                  resizeMode="cover"
                  onLoad={handleHeroImageLoad}
                />
              ) : (
                <View style={styles.heroSkeleton} />
              )}

              {/* Dark scrim — bottom 60% — matches HomeScreen dark-to-light pattern */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.70)']}
                locations={[0.35, 0.6, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />

              {/* Floating nav — back (left) · wishlist + cart (right) */}
              <View style={[styles.heroNav, { paddingTop: insets.top + Space[2] }]}>
                <TouchableOpacity
                  style={styles.floatingBtn}
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="chevron-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.heroNavRight}>
                  <TouchableOpacity
                    style={styles.floatingBtn}
                    onPress={handleWishlistToggle}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon
                      name={wishlisted ? 'heart' : 'heart-outline'}
                      size={20}
                      color={wishlisted ? '#FF6B6B' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.floatingBtn}
                    onPress={() => navigation.navigate('Cart')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="bag-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Discount badge — top-right, always visible on hero */}
              {hasDiscount && (
                <View style={[styles.discountBadge, { top: insets.top + Space[2] + 40 }]}>
                  <Text style={styles.discountBadgeText}>-{discountPct}%</Text>
                </View>
              )}

              {/* Hero footer — brand + price anchored to image bottom */}
              {productDetails && (
                <View style={styles.heroFooter}>
                  <View style={styles.heroFooterLeft}>
                    {productDetails.Brand_Name ? (
                      <Text style={styles.heroBrand}>{productDetails.Brand_Name}</Text>
                    ) : null}
                    <Text style={styles.heroProductName} numberOfLines={2}>
                      {productDetails.Name}
                    </Text>
                  </View>
                  <View style={styles.heroFooterRight}>
                    <Text style={styles.heroPrice}>${productDetails.Price.toFixed(2)}</Text>
                    {hasDiscount && (
                      <Text style={styles.heroWas}>${productDetails.ComparePrice.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* ── Thumbnail strip — image selector ──────────────────────── */}
            {imageThumbs.length > 1 && (
              <View style={styles.thumbStrip}>
                <FlatList
                  data={imageThumbs}
                  renderItem={renderThumb}
                  keyExtractor={(_, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbRail}
                />
              </View>
            )}

            {/* ── Light canvas — product details ────────────────────────── */}
            <Animated.View
              style={[
                styles.canvas,
                { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
              ]}
            >
              {/* Tonal seam — surfaceAlt strip bridges thumbstrip → canvas */}
              <View style={styles.canvasSeam} />

              {productDetails ? (
                <>
                  {/* ── Variant selectors ──────────────────────────────── */}
                  {variantDetails.length > 0 && (
                    <View style={styles.variantSection}>
                      <Text style={styles.microLabel}>Select variant</Text>
                      <View style={styles.variantRow}>
                        {variantDetails.map((v) => (
                          <TouchableOpacity
                            key={v.Inventory_Id}
                            disabled={v.Count === 0}
                            style={[
                              styles.variantChip,
                              v.Count === 0 && styles.variantChipDisabled,
                              selectedVariant === String(v.Inventory_Id) && styles.variantChipSelected,
                            ]}
                            onPress={() => setSelectedVariant(String(v.Inventory_Id))}
                            activeOpacity={0.72}
                          >
                            <Text
                              style={[
                                styles.variantChipText,
                                selectedVariant === String(v.Inventory_Id) && styles.variantChipTextSelected,
                              ]}
                            >
                              {v.Variant}
                            </Text>
                            {v.Count === 0 && <View style={styles.variantStrike} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* ── Hairline divider ───────────────────────────────── */}
                  <View style={styles.rule} />

                  {/* ── Description — editorial pull-quote style ───────── */}
                  {productDetails.Description ? (
                    <View style={styles.descSection}>
                      <Text style={styles.descText}>{productDetails.Description}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                // Skeleton state for canvas
                <View style={styles.skeletonCanvas}>
                  <Skeleton height={16} width="35%" style={{ marginBottom: Space[4] }} />
                  <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[6] }}>
                    <Skeleton height={38} width={72} radius={Radius.sm} />
                    <Skeleton height={38} width={72} radius={Radius.sm} />
                    <Skeleton height={38} width={72} radius={Radius.sm} />
                  </SkeletonRow>
                  <View style={styles.rule} />
                  <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={14} width="75%" />
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* ── Sticky purchase bar ────────────────────────────────────── */}
          <View style={[styles.purchaseBar, { paddingBottom: Math.max(insets.bottom, Space[4]) }]}>
            {/* Quantity inline in bar — not a separate section above */}
            <View style={styles.purchaseQty}>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} size="sm" />
            </View>
            <View style={styles.purchaseCTAs}>
              {/* Secondary — ghost */}
              <TouchableOpacity
                style={styles.ctaGhost}
                onPress={handleBuyNow}
                activeOpacity={0.75}
              >
                <Text style={styles.ctaGhostText}>Buy Now</Text>
              </TouchableOpacity>
              {/* Primary — solid fill */}
              <TouchableOpacity
                style={styles.ctaSolid}
                onPress={handleAddToCart}
                activeOpacity={0.82}
              >
                <Icon name="bag-add-outline" size={16} color="#FFFFFF" />
                <Text style={styles.ctaSolidText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
  },
  errorWrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Space.screenH,
  },
  floatingBack: {
    position: 'absolute',
    left: Space.screenH,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Space[8],
  },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    width: SCREEN_W,
    backgroundColor: '#0A0A0A',
    position: 'relative',
    overflow: 'hidden',
  },
  heroSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.screenH,
  },
  heroNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
  },
  floatingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    right: Space.screenH,
    backgroundColor: Colors.danger,
    borderRadius: Radius.xs,
    paddingVertical: 4,
    paddingHorizontal: Space[2],
  },
  discountBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[5],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroFooterLeft: {
    flex: 1,
    paddingRight: Space[4],
    gap: Space[1],
  },
  heroFooterRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  heroBrand: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroProductName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: FontSize.xl * 1.2,
  },
  heroPrice: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroWas: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.42)',
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },

  // ── Thumbnail strip ───────────────────────────────────────────────────
  thumbStrip: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.line,
  },
  thumbRail: {
    paddingHorizontal: Space.screenH,
    paddingVertical: Space[3],
    gap: Space[2],
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  thumbActive: {
    // Active state: bottom line, not border (less visual noise)
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbActiveLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.ink1,
  },

  // ── Light canvas ──────────────────────────────────────────────────────
  canvas: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Space.screenH,
    paddingTop: 0,
  },
  // Tonal seam — surfaceAlt strip at top of canvas creates a visual breath
  // between the white thumbstrip and the variant/description content below
  canvasSeam: {
    height: Space[6],
    backgroundColor: Colors.surfaceAlt,
    marginHorizontal: -Space.screenH,
    marginBottom: Space[5],
  },

  skeletonCanvas: {
    paddingBottom: Space[6],
  },

  // ── Variant section ───────────────────────────────────────────────────
  variantSection: {
    gap: Space[3],
    marginBottom: Space[5],
  },
  microLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.ink4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Space[2],
  },
  variantChip: {
    paddingHorizontal: Space[4],
    paddingVertical: Space[2] + 2,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.lineStrong,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    position: 'relative',
    overflow: 'hidden',
  },
  variantChipDisabled: {
    opacity: 0.38,
  },
  variantChipSelected: {
    borderColor: Colors.ink1,
    backgroundColor: Colors.ink1,
  },
  variantChipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.ink2,
    letterSpacing: 0.1,
  },
  variantChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
  },
  // Diagonal strike for out-of-stock chips
  variantStrike: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.ink4,
    transform: [{ rotate: '-18deg' }],
  },

  // ── Rule / breath ─────────────────────────────────────────────────────
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginBottom: Space[5],
  },

  // ── Description ───────────────────────────────────────────────────────
  descSection: {
    marginBottom: Space[8],
  },
  descText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    color: Colors.ink2,
    lineHeight: FontSize.base * 1.65,
    letterSpacing: 0.1,
  },

  // ── Purchase bar ──────────────────────────────────────────────────────
  purchaseBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.line,
    paddingTop: Space[3],
    paddingHorizontal: Space.screenH,
    gap: Space[3],
    ...Shadow.lg,
  },
  purchaseQty: {
    // Stepper sits above CTAs — quantity is a choice, not an afterthought
  },
  purchaseCTAs: {
    flexDirection: 'row',
    gap: Space[3],
  },
  // Ghost CTA — editorial restraint, matches HomeScreen hero ghost button
  ctaGhost: {
    flex: 1,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.ink5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaGhostText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: 0.1,
  },
  // Solid CTA — primary action, dominant
  ctaSolid: {
    flex: 2,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ink1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space[2],
  },
  ctaSolidText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});

export default ProductScreen;
