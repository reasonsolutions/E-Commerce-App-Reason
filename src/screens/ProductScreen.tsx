import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { ProductDetailInterface, VariantInterface, PostCartSaveInterface } from '../api/interfaces';
import { postSaveCartItems, selectProduct, addToWishlist, removeFromWishlist, getWishlist } from '../api/services';
import { QuantityStepper, Skeleton, SkeletonRow, ErrorBanner } from '../components/ui';
import { Colors, Space, Radius, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Hero: 58% viewport — image-first, cinematic but leaves room for identity plate
const HERO_H = Math.round(SCREEN_H * 0.58);

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
  const haptic = useHaptic();
  const ctaTactile = useTactile();

  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [wishlistItemCode, setWishlistItemCode] = useState<number | null>(null);

  // Content plate slides up once data arrives
  const plateAnim = useRef(new Animated.Value(0)).current;
  // Hero image fades in
  const heroImgOpacity = useRef(new Animated.Value(0)).current;
  // Cart badge pop on add-to-cart
  const badgeScale = useRef(new Animated.Value(1)).current;

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

  // Identity plate and description settle up once fetch resolves
  useEffect(() => {
    if (!data) return;
    Animated.timing(plateAnim, {
      toValue:  1,
      duration: Motion.duration.settle,
      delay:    60,
      easing:   Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [data, plateAnim]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(userData => {
      if (cancelled || !userData) return;
      const user = JSON.parse(userData);
      setProfileCode(user.CustomerProfileCode);
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
    Animated.timing(heroImgOpacity, {
      toValue:  1,
      duration: Motion.duration.carry,
      easing:   Motion.easing.inOut,
      useNativeDriver: true,
    }).start();
  }, [heroImgOpacity]);

  const handleAddToCart = useCallback(async () => {
    const requestbody: PostCartSaveInterface = {
      CustomerLoginCode:    null,
      CustomerProfileCode:  profileCode!,
      Inventory_Id: selectedVariant
        ? parseInt(selectedVariant)
        : (data?.product?.Inventory_Id ?? 0),
      BranchCode:     null,
      CountryCode:    null,
      Quantity:       quantity,
      SpecialRemarks: '',
    };
    try {
      await postSaveCartItems(requestbody);
      setCartCount((prev: number) => prev + quantity);
      haptic.success();
      // Badge pop: 1 → 1.15 → 1 on snap spring
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
        Animated.spring(badgeScale, { toValue: 1, ...Motion.spring.settle }),
      ]).start();
      navigation.navigate('Cart');
    } catch (err) {
      console.error('Error adding to cart: ', err);
    }
  }, [profileCode, selectedVariant, data, quantity, haptic, badgeScale, setCartCount, navigation]);

  const handleBuyNow = useCallback(() => {
    handleAddToCart();
  }, [handleAddToCart]);

  const handleWishlistToggle = useCallback(async () => {
    if (!profileCode) return;
    haptic.light();
    const inventoryId = Number(route?.params?.product ?? 0);
    if (wishlisted && wishlistItemCode !== null) {
      await removeFromWishlist(profileCode, wishlistItemCode).catch(() => {});
      setWishlisted(false);
      setWishlistItemCode(null);
    } else {
      const res = await addToWishlist(profileCode, inventoryId).catch(() => null);
      if (res?.statusCode === 1) {
        getWishlist(profileCode).then(wRes => {
          if (wRes.statusCode === 1) {
            const match = (wRes.result || []).find((w: any) => w.Inventory_Id === inventoryId);
            if (match) setWishlistItemCode(match.WishlistItemCode);
          }
        }).catch(() => {});
        setWishlisted(true);
      }
    }
  }, [profileCode, wishlisted, wishlistItemCode, haptic, route?.params?.product]);

  const handleVariantSelect = useCallback((variantId: string) => {
    haptic.light();
    setSelectedVariant(variantId);
  }, [haptic]);

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

  const plateStyle = {
    opacity: plateAnim,
    transform: [{
      translateY: plateAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
    }],
  };

  const renderThumb = useCallback(({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[styles.thumb, selectedImageIndex === index && styles.thumbActive]}
      onPress={() => {
        haptic.light();
        setSelectedImageIndex(index);
      }}
      activeOpacity={0.75}
    >
      <Animated.Image source={{ uri: item }} style={styles.thumbImg} resizeMode="cover" />
      {selectedImageIndex === index && <View style={styles.thumbActiveLine} />}
    </TouchableOpacity>
  ), [selectedImageIndex, haptic]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {isError ? (
        <View style={[styles.errorWrap, { paddingTop: insets.top + Space[12] }]}>
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
            {/* ── Hero — full-bleed cinematic, no text overlay ──────────── */}
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

              {/* Minimal top seal — keeps nav legible over any image */}
              <LinearGradient
                colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.0)']}
                locations={[0, 0.28]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />

              {/* Floating nav */}
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
                      color={wishlisted ? Colors.accent : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.floatingBtn}
                    onPress={() => navigation.navigate('Cart')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                      <Icon name="bag-outline" size={20} color="#FFFFFF" />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ember discount marker — top-left inset, mono, restrained */}
              {hasDiscount && (
                <View style={[styles.discountMarker, { top: insets.top + Space[2] + 44 }]}>
                  <Text style={styles.discountMarkerText}>-{discountPct}%</Text>
                </View>
              )}
            </View>

            {/* ── Thumbnail strip — only when multiple images ───────────── */}
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

            {/* ── Identity plate — brand / name / price ─────────────────── */}
            <Animated.View style={[styles.identityPlate, plateStyle]}>
              {productDetails ? (
                <>
                  {productDetails.Brand_Name ? (
                    <Text style={styles.brandLabel}>{productDetails.Brand_Name}</Text>
                  ) : null}

                  <Text style={styles.productName} numberOfLines={3}>
                    {productDetails.Name}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.price}>${productDetails.Price.toFixed(2)}</Text>
                    {hasDiscount && (
                      <Text style={styles.priceWas}>${productDetails.ComparePrice.toFixed(2)}</Text>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.skeletonIdentity}>
                  <Skeleton height={11} width="22%" style={{ marginBottom: Space[3] }} />
                  <Skeleton height={26} width="78%" style={{ marginBottom: Space[1] + 2 }} />
                  <Skeleton height={26} width="55%" style={{ marginBottom: Space[4] }} />
                  <Skeleton height={32} width="36%" />
                </View>
              )}
            </Animated.View>

            {/* ── Rule ──────────────────────────────────────────────────── */}
            <View style={styles.rule} />

            {/* ── Variant + description canvas ──────────────────────────── */}
            <Animated.View style={[styles.canvas, plateStyle]}>
              {productDetails ? (
                <>
                  {/* Variant selector */}
                  {variantDetails.length > 0 && (
                    <View style={styles.variantSection}>
                      <Text style={styles.sectionLabel}>Variant</Text>
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
                            onPress={() => handleVariantSelect(String(v.Inventory_Id))}
                            activeOpacity={0.75}
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

                  {/* Description */}
                  {productDetails.Description ? (
                    <>
                      <View style={styles.descRule} />
                      <View style={styles.descSection}>
                        <Text style={styles.sectionLabel}>Details</Text>
                        <Text style={styles.descText}>{productDetails.Description}</Text>
                      </View>
                    </>
                  ) : null}
                </>
              ) : (
                <View style={styles.skeletonCanvas}>
                  <Skeleton height={11} width="18%" style={{ marginBottom: Space[3] }} />
                  <SkeletonRow gap={Space[2]} style={{ marginBottom: Space[6] }}>
                    <Skeleton height={40} width={72} radius={Radius.sm} />
                    <Skeleton height={40} width={72} radius={Radius.sm} />
                    <Skeleton height={40} width={72} radius={Radius.sm} />
                  </SkeletonRow>
                  <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={14} style={{ marginBottom: Space[2] }} />
                  <Skeleton height={14} width="70%" />
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* ── Sticky purchase bar ────────────────────────────────────── */}
          <View
            style={[
              styles.purchaseBar,
              { paddingBottom: Math.max(insets.bottom, Space[4]) },
            ]}
          >
            <View style={styles.purchaseTop}>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} size="sm" />
            </View>

            {/* Primary CTA */}
            <Animated.View style={ctaTactile.animatedStyle}>
              <TouchableOpacity
                style={styles.ctaPrimary}
                onPress={handleAddToCart}
                {...ctaTactile.handlers}
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel="Add to bag"
              >
                <Text style={styles.ctaPrimaryText}>Add to Bag</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Secondary — text link, subordinate */}
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={handleBuyNow}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel="Buy now"
            >
              <Text style={styles.ctaSecondaryText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },
  errorWrap: {
    flex:              1,
    backgroundColor:   Colors.surface,
    paddingHorizontal: Space.screenH,
  },
  floatingBack: {
    position:        'absolute',
    left:            Space.screenH,
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.surfaceAlt,
    justifyContent:  'center',
    alignItems:      'center',
    ...Shadow.sm,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Space[8],
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    width:           SCREEN_W,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
  },
  heroSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surfaceDeep,
  },
  heroImg: {
    width:  '100%',
    height: '100%',
  },
  heroNav: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
  },
  heroNavRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
  },
  floatingBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(0,0,0,0.22)',
    justifyContent:  'center',
    alignItems:      'center',
  },

  // Ember discount marker — replaces red danger chip per spec A7
  discountMarker: {
    position:          'absolute',
    left:              Space.screenH,
    backgroundColor:   Colors.accentTint,
    borderRadius:      Radius.xs,
    paddingVertical:   3,
    paddingHorizontal: Space[2],
    borderWidth:       0.5,
    borderColor:       Colors.accent,
  },
  discountMarkerText: {
    ...Type.label,
    color:         Colors.accent,
    letterSpacing: 0.6,
    textTransform: 'none',
  },

  // ── Thumbnail strip ────────────────────────────────────────────────────────
  thumbStrip: {
    backgroundColor: Colors.surfaceSoft,
  },
  thumbRail: {
    paddingHorizontal: Space.screenH,
    paddingVertical:   Space[3],
    gap:               Space[2],
  },
  thumb: {
    width:            56,
    height:           56,
    borderRadius:     Radius.sm,
    overflow:         'hidden',
    backgroundColor:  Colors.surfaceDeep,
  },
  thumbActive: {
    // Active state: bottom line indicator, no border
  },
  thumbImg: {
    width:  '100%',
    height: '100%',
  },
  thumbActiveLine: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    height:          2,
    backgroundColor: Colors.ink1,
  },

  // ── Identity plate — brand / name / price ─────────────────────────────────
  identityPlate: {
    backgroundColor:   Colors.surface,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[4],
  },
  brandLabel: {
    ...Type.label,
    color:         Colors.ink3,
    marginBottom:  Space[2],
  },
  productName: {
    ...Type.heading,
    fontSize:      24,
    letterSpacing: -0.4,
    lineHeight:    24 * 1.18,
    color:         Colors.ink1,
    marginBottom:  Space[3],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[2] + 2,
  },
  price: {
    ...Type.priceLarge,
    color: Colors.ink1,
  },
  priceWas: {
    ...Type.caption,
    fontFamily:         FontFamily.mono,
    textDecorationLine: 'line-through',
    color:              Colors.ink4,
    letterSpacing:      0.2,
  },

  rule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginHorizontal: Space.screenH,
  },

  // ── Canvas — variants + description ──────────────────────────────────────
  canvas: {
    backgroundColor:   Colors.surface,
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
  },

  // ── Variant section ───────────────────────────────────────────────────────
  sectionLabel: {
    ...Type.label,
    color:        Colors.ink3,
    marginBottom: Space[3],
  },
  variantSection: {
    marginBottom: Space[5],
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Space[2],
  },
  variantChip: {
    paddingHorizontal: Space[4],
    paddingVertical:   Space[2] + 2,
    borderRadius:      Radius.sm,
    borderWidth:       1,
    borderColor:       Colors.rule,
    backgroundColor:   Colors.surfaceSoft,
    alignItems:        'center',
    justifyContent:    'center',
    minWidth:          56,
    position:          'relative',
    overflow:          'hidden',
  },
  variantChipDisabled: {
    opacity: 0.36,
  },
  // Hairline ink stroke on selected — no fill, editorial restraint
  variantChipSelected: {
    borderWidth: 1.5,
    borderColor: Colors.ink1,
    backgroundColor: Colors.surface,
  },
  variantChipText: {
    fontFamily:    FontFamily.mono,
    fontSize:      12,
    fontWeight:    '400',
    color:         Colors.ink2,
    letterSpacing: 0.3,
  },
  variantChipTextSelected: {
    color: Colors.ink1,
  },
  variantStrike: {
    position:        'absolute',
    top:             '50%',
    left:            0,
    right:           0,
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.ink4,
    transform:       [{ rotate: '-18deg' }],
  },

  // ── Description ───────────────────────────────────────────────────────────
  descRule: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginBottom:    Space[5],
  },
  descSection: {
    marginBottom: Space[8],
  },
  descText: {
    ...Type.body,
    color:      Colors.ink2,
    lineHeight: 16 * 1.7,
  },

  // ── Skeleton states ───────────────────────────────────────────────────────
  skeletonIdentity: {
    paddingBottom: Space[2],
  },
  skeletonCanvas: {
    paddingBottom: Space[6],
  },

  // ── Purchase bar ──────────────────────────────────────────────────────────
  // surfaceDeep background + Shadow.sm when overlapping content (sticky)
  purchaseBar: {
    backgroundColor:   Colors.surfaceDeep,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingTop:        Space[3],
    paddingHorizontal: Space.screenH,
    gap:               Space[2],
    ...Shadow.sm,
  },
  purchaseTop: {
    // Quantity stepper row — choice before commitment
  },
  ctaPrimary: {
    width:           '100%',
    height:          52,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  ctaPrimaryText: {
    ...Type.bodyStrong,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },
  ctaSecondary: {
    alignItems:    'center',
    paddingVertical: Space[1],
  },
  ctaSecondaryText: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
    letterSpacing:      0.2,
  },
});

export default ProductScreen;
