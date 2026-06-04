import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ProductDetailInterface,
  PostCartSaveInterface,
  WishlistItemInterface,
  VariantInterface,
} from '../api/interfaces';
import { ItemCondition } from '../config/enum_files/ItemCondition';
import { postSaveCartItems } from '../api/cart';
import { getProductByItemId } from '../api/product';
import { addToWishlist, removeFromWishlist, getWishlist } from '../api/wishlist';
import { addToGuestCart } from '../api/cart';
import { getOrgIdForInventory } from '../api/product';

import {
  Skeleton,
  ErrorBanner,
  PrimaryButton,
  BreadcrumbRow,
  DeliveryBand,
  VariantChipGrid,
  type VariantChipOption,
  TrustCardRow,
  ProductSpecs,
  SellerCard,
  LoginPromptSheet,
} from '../components/ui';

import { Colors, Space, Shadow } from '../theme';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useProfileCode } from '../hooks/useProfileCode';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { STORAGE_KEYS } from '../config/storageKeys';
import { resolveImageUrl } from '../utils/resolveImageUrl';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = SCREEN_W * 0.85;
const NAV_H  = 52;

// Design tokens local to this screen
const INK     = Colors.ink1;
const COND_BG = '#EDF7EE';
const COND_FG = '#2E7D32';

type ProductFetch = { product: ProductDetailInterface };

type ProductScreenProps = {
  navigation: { goBack: () => void; navigate: (screen: string) => void };
  route: { params?: { product?: string } };
};

const CONDITION_LABELS: Record<number, string> = {
  [ItemCondition.New]:         'NEW',
  [ItemCondition.Used]:        'USED',
  [ItemCondition.Refurbished]: 'REFURB',
};

const ProductScreen: React.FC<ProductScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const haptic = useHaptic();
  const toast = useAppToast();
  const profileCode = useProfileCode();
  const { guard, showLoginPrompt, dismissLoginPrompt } = useAuthGuard();

  // ── State ────────────────────────────────────────────────────────────────────
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [wishlistItemCode, setWishlistItemCode] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);

  // ── Animated values ──────────────────────────────────────────────────────────
  const scrollY     = useRef(new Animated.Value(0)).current;
  const badgeScale  = useRef(new Animated.Value(1)).current;
  const plateAnim   = useRef(new Animated.Value(0)).current;

  // Nav background: transparent over hero, light surface once scrolled past
  const navBgColor = scrollY.interpolate({
    inputRange:  [HERO_H - 80, HERO_H],
    outputRange: ['transparent', Colors.surface],
    extrapolate: 'clamp',
  });
  const pillBg = scrollY.interpolate({
    inputRange:  [0, HERO_H - 80],
    outputRange: ['rgba(0,0,0,0.28)', 'rgba(0,0,0,0.0)'],
    extrapolate: 'clamp',
  });
  const navBorderOpacity = scrollY.interpolate({
    inputRange:  [HERO_H - 80, HERO_H],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const navBorderColor = navBorderOpacity.interpolate({
    inputRange:  [0, 1],
    outputRange: ['rgba(0,0,0,0)', Colors.rule],
  });

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const { data, isError, error, run } = useAsyncState<ProductFetch>(null);

  const fetchProduct = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const res = await getProductByItemId(route?.params?.product ?? '1');
        return { product: res.result as ProductDetailInterface };
      }, cancelled),
    [run, route?.params?.product],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchProduct(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchProduct]);

  // Pre-select first in-stock variant on load + entrance animation
  useEffect(() => {
    if (!data) return;
    Animated.timing(plateAnim, {
      toValue: 1, duration: Motion.duration.settle, delay: 60,
      easing: Motion.easing.out, useNativeDriver: true,
    }).start();
    const variants = data.product?.Variants ?? [];
    const firstInStock = variants.find(v => v.StockStatus?.Description !== 'out_of_stock');
    const preselect = firstInStock ?? variants[0];
    if (preselect) setSelectedVariantId(String(preselect.InventoryId));
  }, [data, plateAnim]);

  // Recently viewed write
  useEffect(() => {
    if (!data?.product) return;
    const p = data.product;
    const itemIdNum = parseInt(p.ItemId, 10);
    const preselect = p.Variants?.find(v => v.StockStatus?.Description !== 'out_of_stock') ?? p.Variants?.[0];
    AsyncStorage.getItem(STORAGE_KEYS.recentlyViewed).then(raw => {
      const prev: any[] = raw ? JSON.parse(raw) : [];
      const snapshot = {
        ItemID:          itemIdNum,
        Name:            p.Name,
        BrandName:       p.BrandName,
        Images:          Array.isArray(p.Images)
          ? (p.Images as unknown as string[]).join(';')
          : p.Images,
        MinPrice:        preselect?.PriceDetails?.Price ?? 0,
        MaxComparePrice: preselect?.PriceDetails?.ComparePrice ?? 0,
        Inventory_Id:    preselect?.InventoryId ?? null,
      };
      const next = [snapshot, ...prev.filter((x: any) => x.ItemID !== itemIdNum)].slice(0, 8);
      AsyncStorage.setItem(STORAGE_KEYS.recentlyViewed, JSON.stringify(next));
    }).catch(() => {});
  }, [data]);

  // Wishlist match on load
  useEffect(() => {
    if (!data?.product || !profileCode) return;
    let cancelled = false;
    const inventoryId = Number(data.product.Variants?.[0]?.InventoryId ?? 0);
    getWishlist(profileCode).then(res => {
      if (cancelled) return;
      if (res.statusCode === 1) {
        const match = (res.result || []).find((w: WishlistItemInterface) => w.InventoryID === inventoryId);
        if (match) { setWishlisted(true); setWishlistItemCode(match.WishlistCode); }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [data, profileCode]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const productDetails = data?.product ?? null;
  const variantDetails = productDetails?.Variants ?? [];
  const selectedVariant = variantDetails.find(v => String(v.InventoryId) === selectedVariantId) ?? variantDetails[0] ?? null;

  const imageUrls: string[] = productDetails?.Images
    ? (Array.isArray(productDetails.Images)
        ? (productDetails.Images as unknown as string[])
        : productDetails.Images.split(';').map(s => s.trim())
      ).filter(Boolean).map(resolveImageUrl)
    : [];

  const activePrice        = selectedVariant?.PriceDetails?.Price ?? 0;
  const activeComparePrice = selectedVariant?.PriceDetails?.ComparePrice ?? 0;
  const hasDiscount        = activeComparePrice > activePrice;
  const discountPct        = hasDiscount
    ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100) : 0;

  const isOOS       = selectedVariant?.StockStatus?.Description === 'out_of_stock'
                      && !selectedVariant?.BackOrder?.AllowBackOrder;
  const isBackorder = selectedVariant?.StockStatus?.Description === 'out_of_stock'
                      && selectedVariant?.BackOrder?.AllowBackOrder === true;
  const maxQty      = selectedVariant?.MaxPerOrder ?? 10;

  const chipOptions: VariantChipOption[] = useMemo(
    () => variantDetails.map(v => ({
      id:         String(v.InventoryId),
      label:      v.Variant,
      outOfStock: v.StockStatus?.Description === 'out_of_stock',
      lowStock:   v.StockStatus?.Description !== 'out_of_stock' && v.Stock <= v.Threshold,
    })),
    [variantDetails],
  );

  const selectedChip = chipOptions.find(c => c.id === selectedVariantId);
  const lowStockLabel = selectedChip?.lowStock && selectedVariant
    ? `Only ${selectedVariant.Stock} left in ${selectedVariant.Variant}`
    : null;

  const conditionLabel = selectedVariant?.PhysicalAttributes?.Condition?.Value != null
    ? CONDITION_LABELS[selectedVariant.PhysicalAttributes.Condition.Value] ?? null
    : null;

  const plateStyle = {
    opacity: plateAnim,
    transform: [{ translateY: plateAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleVariantSelect = useCallback((id: string) => {
    haptic.light();
    const newVariant = variantDetails.find(v => String(v.InventoryId) === id);
    setSelectedVariantId(id);
    if (newVariant) {
      const newMax = newVariant.MaxPerOrder ?? 10;
      const newIsOOS = newVariant.StockStatus?.Description === 'out_of_stock'
                       && !newVariant.BackOrder?.AllowBackOrder;
      if (newIsOOS) setQuantity(1);
      else setQuantity(q => Math.min(q, newMax));
    }
  }, [haptic, variantDetails]);

  const handleAddToCart = useCallback(async () => {
    if (isOOS && !isBackorder) {
      haptic.warning();
      toast.warning({ title: 'Out of stock', description: 'This variant is currently unavailable.' });
      return;
    }
    const firstVariantId = data?.product?.Variants?.[0]?.InventoryId;
    const inventoryId = selectedVariantId
      ? parseInt(selectedVariantId)
      : parseInt(firstVariantId ?? '0');

    setAddingToCart(true);
    try {
      if (profileCode) {
        const requestbody: PostCartSaveInterface = {
          CustomerProfileCode: profileCode,
          InventoryId: inventoryId,
          Quantity: quantity,
          IsPurchased: false,
        };
        const res = await postSaveCartItems(requestbody);
        if (res?.statusCode !== 1) {
          haptic.warning();
          toast.error({ title: "Couldn't add to bag", description: res?.userMessage ?? 'Something went wrong.' });
          return;
        }
        setCartCount((prev: number) => prev + quantity);
      } else {
        const product = data?.product;
        const variantObj = product?.Variants?.find((v: VariantInterface) =>
          String(v.InventoryId) === selectedVariantId) ?? product?.Variants?.[0];
        await addToGuestCart({
          inventoryId,
          quantity,
          price:          variantObj?.PriceDetails?.Price ?? 0,
          comparePrice:   variantObj?.PriceDetails?.ComparePrice ?? 0,
          name:           product?.Name ?? '',
          brandName:      product?.BrandName ?? '',
          variant:        variantObj?.Variant ?? '',
          image:          Array.isArray(product?.Images)
            ? (product.Images as unknown as string[])[0] ?? ''
            : product?.Images?.split(';')[0] ?? '',
          organisationId: getOrgIdForInventory(inventoryId) ?? '',
        });
        setCartCount((prev: number) => prev + quantity);
      }

      haptic.success();
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
        Animated.spring(badgeScale, { toValue: 1, ...Motion.spring.settle }),
      ]).start();
      navigation.navigate('Cart');
    } catch {
      haptic.warning();
      toast.error({ title: "Couldn't add to bag", description: 'Check your connection and try again.' });
    } finally {
      setAddingToCart(false);
    }
  }, [profileCode, selectedVariantId, data, quantity, haptic, badgeScale, setCartCount, navigation, isOOS, isBackorder, toast]);

  const handleWishlistToggle = useCallback(() => {
    guard(async () => {
      if (!profileCode) return;
      haptic.light();
      const firstVariantId = data?.product?.Variants?.[0]?.InventoryId;
      const inventoryId = selectedVariantId
        ? parseInt(selectedVariantId)
        : parseInt(firstVariantId ?? '0');
      if (wishlisted && wishlistItemCode !== null) {
        await removeFromWishlist(profileCode, wishlistItemCode).catch(() => {});
        setWishlisted(false); setWishlistItemCode(null);
      } else {
        const res = await addToWishlist(profileCode, inventoryId).catch(() => null);
        if (res?.statusCode !== 1) {
          haptic.warning();
          toast.warning({ title: 'Wishlist', description: res?.userMessage ?? 'Something went wrong.' });
          return;
        }
        if (res?.statusCode === 1) {
          getWishlist(profileCode).then(wRes => {
            if (wRes.statusCode === 1) {
              const match = (wRes.result || []).find((w: WishlistItemInterface) => w.InventoryID === inventoryId);
              if (match) setWishlistItemCode(match.WishlistCode);
            }
          }).catch(() => {});
          setWishlisted(true);
        }
      }
    });
  }, [guard, profileCode, wishlisted, wishlistItemCode, haptic, data, selectedVariantId, toast]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + Space[12] }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={20} color={Colors.ink1} />
        </TouchableOpacity>
        <ErrorBanner
          title="Couldn't load product"
          body={error ?? 'Check your connection and try again.'}
          onRetry={() => fetchProduct()}
        />
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Floating nav bar (over hero) ──────────────────────────────────── */}
      <Animated.View
        style={[styles.navBar, { backgroundColor: navBgColor, top: insets.top, borderBottomColor: navBorderColor }]}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.navPill, { backgroundColor: pillBg }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-back" size={19} color="rgba(255,255,255,0.95)" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.navRight}>
          <Animated.View style={[styles.navPill, { backgroundColor: pillBg }]}>
            <TouchableOpacity
              onPress={handleWishlistToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={18}
                color={wishlisted ? Colors.accent : 'rgba(255,255,255,0.95)'}
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.navPill, { backgroundColor: pillBg }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Cart')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                <Icon name="bag-outline" size={18} color="rgba(255,255,255,0.95)" />
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* Hero gallery */}
        <View style={styles.heroContainer}>
          {imageUrls.length > 1 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={{ width: SCREEN_W, height: HERO_H }}
              onScroll={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                setActiveImageIndex(idx);
              }}
              scrollEventThrottle={16}
            >
              {imageUrls.map((url, i) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  style={{ width: SCREEN_W, height: HERO_H, resizeMode: 'cover' }}
                />
              ))}
            </ScrollView>
          ) : imageUrls.length === 1 ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={{ width: SCREEN_W, height: HERO_H, resizeMode: 'cover' }}
            />
          ) : (
            <View style={[styles.heroPlaceholder, { width: SCREEN_W, height: HERO_H }]} />
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.20)']}
            locations={[0, 0.32, 0.68, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Discount badge */}
          {hasDiscount ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>–{discountPct}%</Text>
            </View>
          ) : null}

          {/* Dot indicators */}
          {imageUrls.length > 1 ? (
            <View style={styles.dotsRow}>
              {imageUrls.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Breadcrumb */}
        <BreadcrumbRow
          category={productDetails?.CategoryName}
          subCategory={productDetails?.SubCategoryName}
        />

        {/* Identity plate */}
        <Animated.View style={[styles.identityPlate, plateStyle]}>
          {productDetails ? (
            <>
              {/* Brand + seller eyebrow */}
              <View style={styles.eyebrowRow}>
                {productDetails.BrandName ? (
                  <Text style={styles.eyebrowBrand}>
                    {productDetails.BrandName.toUpperCase()}
                  </Text>
                ) : null}
                {productDetails.BrandName && productDetails.OrganisationName ? (
                  <Text style={styles.eyebrowDot}>·</Text>
                ) : null}
                {productDetails.OrganisationName ? (
                  <Text style={styles.eyebrowSeller}>
                    Sold by {productDetails.OrganisationName}
                  </Text>
                ) : null}
              </View>

              {/* Product name */}
              <Text style={styles.productName}>{productDetails.Name}</Text>

              {/* Condition badge */}
              {conditionLabel ? (
                <View style={styles.conditionBadge}>
                  <Text style={styles.conditionText}>{conditionLabel}</Text>
                </View>
              ) : null}

              {/* Price row */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>Rs {activePrice.toFixed(0)}</Text>
                {hasDiscount ? (
                  <>
                    <Text style={styles.comparePrice}>
                      Rs {activeComparePrice.toFixed(0)}
                    </Text>
                    <Text style={styles.discountInline}>{discountPct}% off</Text>
                  </>
                ) : null}
              </View>
            </>
          ) : (
            <View style={{ gap: Space[2] }}>
              <Skeleton height={11} width="22%" />
              <Skeleton height={26} width="78%" />
              <Skeleton height={26} width="55%" />
              <Skeleton height={32} width="36%" />
            </View>
          )}
        </Animated.View>

        {/* Delivery band */}
        {productDetails ? (
          <DeliveryBand
            freeShipping={productDetails.ShippingInfo?.FreeShipping ?? false}
            estimatedDeliveryDays={productDetails.ShippingInfo?.EstimatedDeliveryDays}
            isOOS={isOOS}
            isBackorder={isBackorder}
          />
        ) : null}

        {/* Variant chip grid */}
        <Animated.View style={plateStyle}>
          <VariantChipGrid
            options={chipOptions}
            selectedId={selectedVariantId}
            onSelect={handleVariantSelect}
            sizeChartUrl={productDetails?.AdditionalInfo?.SizeChart}
            lowStockLabel={lowStockLabel}
          />
        </Animated.View>

        {/* Trust cards */}
        {productDetails ? (
          <TrustCardRow
            policy={productDetails.PolicyInfo}
            shipping={productDetails.ShippingInfo}
          />
        ) : null}

        {/* Description + specs as accordions */}
        <ProductSpecs
          description={productDetails?.Description}
          color={productDetails?.AdditionalInfo?.Color}
          material={productDetails?.AdditionalInfo?.MaterialComposition}
          care={productDetails?.AdditionalInfo?.CareInstructions}
          weight={selectedVariant?.PhysicalAttributes?.Weight ?? null}
          weightUnit={selectedVariant?.PhysicalAttributes?.WeightUnit?.Description ?? null}
        />

        {/* Seller card */}
        <SellerCard
          sellerName={productDetails?.OrganisationName}
          manufacturer={productDetails?.ProductClassification?.Manufacturer}
          countryOfOrigin={productDetails?.ProductClassification?.CountryOfOrigin}
        />

        <View style={{ height: 8, backgroundColor: Colors.surface }} />
      </Animated.ScrollView>

      {/* ── Purchase bar ──────────────────────────────────────────────────── */}
      <View
        style={[
          styles.purchaseBar,
          { paddingBottom: Math.max(insets.bottom, Space[3]) },
          Shadow.sm,
        ]}
      >
        {!isOOS ? (
          <View style={styles.stepperRow}>
            <TouchableOpacity
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              style={styles.stepBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="remove" size={12} color={INK} />
            </TouchableOpacity>
            <Text style={styles.stepCount}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(q => Math.min(maxQty, q + 1))}
              style={styles.stepBtn}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="add" size={12} color={INK} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={isOOS ? 'Out of Stock' : 'Add to Bag'}
            loading={addingToCart}
            onPress={handleAddToCart}
            isDisabled={isOOS}
            height={44}
          />
        </View>
      </View>

      {showLoginPrompt ? (
        <LoginPromptSheet
          onClose={dismissLoginPrompt}
          onSignIn={() => { dismissLoginPrompt(); navigation.navigate('Login'); }}
          onRegister={() => { dismissLoginPrompt(); navigation.navigate('Register'); }}
        />
      ) : null}
    </View>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    position:          'absolute',
    left:              0,
    right:             0,
    zIndex:            30,
    height:            NAV_H,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  heroContainer: {
    position: 'relative',
    height: HERO_H,
    backgroundColor: Colors.surfaceDeep,
  },
  heroPlaceholder: {
    backgroundColor: Colors.surfaceDeep,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: 'rgba(27,12,8,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.04 * 12,
    color: Colors.accent,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.38)',
  },

  // ── Identity plate ─────────────────────────────────────────────────────────
  identityPlate: {
    paddingHorizontal: Space[4],
    paddingTop:        Space[4],
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
    gap:               Space[2],
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  2,
  },
  eyebrowBrand: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    fontWeight:    '400',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color:         Colors.ink3,
  },
  eyebrowDot: {
    color:    Colors.ink4,
    fontSize: 10,
  },
  eyebrowSeller: {
    fontFamily: FontFamily.sans,
    fontSize:   11,
    color:      Colors.ink3,
  },
  productName: {
    fontFamily:    FontFamily.sans,
    fontSize:      20,
    fontWeight:    '600',
    color:         Colors.ink1,
    lineHeight:    20 * 1.25,
    marginBottom:  4,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COND_BG,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 11,
  },
  conditionText: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.06 * 10,
    color: COND_FG,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 8,
  },
  price: {
    fontFamily: FontFamily.serif,
    fontSize: 28,
    fontWeight: '600',
    color: INK,
    lineHeight: 28,
  },
  comparePrice: {
    fontFamily:         FontFamily.sans,
    fontSize:           14,
    color:              Colors.ink4,
    textDecorationLine: 'line-through',
  },
  discountInline: {
    fontFamily:  FontFamily.sans,
    fontSize:    12,
    fontWeight:  '600',
    color:       Colors.accent,
  },

  // ── Purchase bar ───────────────────────────────────────────────────────────
  purchaseBar: {
    backgroundColor:   Colors.surface,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingHorizontal: Space[4],
    paddingTop:        Space[3],
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Space[3],
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[2],
    flexShrink:    0,
  },
  stepBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: Colors.surfaceSoft,
    borderWidth:     1,
    borderColor:     Colors.rule,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepCount: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: INK,
    minWidth: 18,
    textAlign: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space[4],
  },
});
