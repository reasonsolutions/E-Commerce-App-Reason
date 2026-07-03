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
  ProductInterface,
} from '../api/interfaces';
import { ItemCondition } from '../config/enum_files/ItemCondition';
import { postSaveCartItems } from '../api/cart';
import { getProductByItemId } from '../api/product';
import { addToWishlist, removeFromWishlist, getWishlist } from '../api/wishlist';
import { addToGuestCart } from '../api/cart';
import { getOrgIdForInventory } from '../api/product';
import ProductCard from '../components/ProductCard';

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

import { Colors, Space, Shadow, Radius } from '../theme';

const HeroImage: React.FC<{ uri: string; width: number; height: number; onError: () => void }> = ({ uri, width, height, onError }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(opacity, { toValue: 1, duration: Motion.duration.settle, easing: Motion.easing.out, useNativeDriver: true }).start();
  }, [opacity]);
  return (
    <Animated.Image
      source={{ uri }}
      style={{ width, height, opacity }}
      resizeMode="contain"
      onLoad={onLoad}
      onError={onError}
    />
  );
};
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useProfileCode } from '../hooks/useProfileCode';
import { useAppToast } from '../hooks/useAppToast';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { wishlistCache } from '../utils/wishlistCache';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = SCREEN_W; // 1:1 — matches product photo aspect ratio
const NAV_H  = 52;

// Design tokens local to this screen
const INK     = Colors.ink1;
const COND_BG = Colors.surfaceDeep;
const COND_FG = Colors.ink2;

type ProductFetch = { product: ProductDetailInterface };

type ProductScreenProps = {
  navigation: { goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void };
  route: { params?: { product?: string } };
};

const CONDITION_LABELS: Record<number, string> = {
  [ItemCondition.New]:         'NEW',
  [ItemCondition.Used]:        'USED',
  [ItemCondition.Refurbished]: 'REFURB',
};

// Related products arrive as ProductDetailInterface (detail-page shape, pricing
// nested under Variants[0]) — ProductCard expects the listing shape
// (ProductInterface, flat MinPrice/MaxComparePrice/DiscountPct). This maps the
// handful of fields ProductCard actually reads; unused nested objects get inert
// placeholders since ProductCard never touches them.
function mapRelatedProductToCard(p: ProductDetailInterface): ProductInterface {
  const variant = p.Variants?.[0];
  const price = variant?.PriceDetails?.Price ?? 0;
  const comparePrice = variant?.PriceDetails?.ComparePrice ?? 0;
  return {
    ItemID:                Number(p.ItemId),
    Name:                  p.Name,
    OrganisationName:      p.OrganisationName,
    OrganisationId:        p.OrganisationID,
    Description:           p.Description,
    SubcategoryID:         p.SubCategoryId,
    Images:                p.Images,
    CreatedDate:           p.DateCreated,
    BrandID:               String(p.BrandId),
    BrandName:             p.BrandName,
    SCName:                p.SubCategoryName,
    CategoryID:            p.CategoryId,
    CategoryName:          p.CategoryName,
    CategoryImage:         p.CategoryImage,
    RelatedProducts:       null,
    MinPrice:              price,
    MaxComparePrice:       comparePrice,
    DiscountPct:           comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0,
    Inventory_Id:          variant ? Number(variant.InventoryId) : undefined,
    Variant:               variant?.Variant,
    ComplianceInfo:        p.ComplianceInfo as unknown as ProductInterface['ComplianceInfo'],
    ProductClassification: p.ProductClassification,
    Marketing:             p.Marketing,
    PolicyInfo:            p.PolicyInfo,
    AdditionalInfo:        p.AdditionalInfo,
    ShippingInfo:          p.ShippingInfo,
    Variants:              p.Variants as unknown as ProductInterface['Variants'],
  };
}

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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [wishlistItemCode, setWishlistItemCode] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [relatedProducts, setRelatedProducts] = useState<ProductDetailInterface[]>([]);

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
    outputRange: ['rgba(0,0,0,0.16)', 'rgba(0,0,0,0.0)'],
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
    AsyncStorage.getItem(STORAGE_KEYS.userData).then(userRaw => {
      const code: number | null = userRaw ? (JSON.parse(userRaw).CustomerProfileCode ?? null) : null;
      const key = scopedKey('recentlyViewed', code);
      return AsyncStorage.getItem(key).then(raw => {
        const prev: any[] = raw ? JSON.parse(raw) : [];
        const minPrice = preselect?.PriceDetails?.Price ?? 0;
        const maxComparePrice = preselect?.PriceDetails?.ComparePrice ?? 0;
        // getProductByItemId has no top-level DiscountPct (unlike allProducts) — derive it here
        const snapshot = {
          ItemID:          itemIdNum,
          Name:            p.Name,
          BrandName:       p.BrandName,
          Images:          Array.isArray(p.Images)
            ? (p.Images as unknown as string[]).join(';')
            : p.Images,
          MinPrice:        minPrice,
          MaxComparePrice: maxComparePrice,
          DiscountPct:     maxComparePrice > minPrice
            ? Math.round(((maxComparePrice - minPrice) / maxComparePrice) * 100)
            : 0,
          Inventory_Id:    preselect?.InventoryId ?? null,
        };
        const next = [snapshot, ...prev.filter((x: any) => x.ItemID !== itemIdNum)].slice(0, 8);
        AsyncStorage.setItem(key, JSON.stringify(next));
      });
    }).catch(() => {});
  }, [data]);

  // Wishlist match on load — runs once we have both product data and a logged-in profile
  useEffect(() => {
    if (!data?.product || !profileCode) return;
    let cancelled = false;
    getWishlist(profileCode).then(res => {
      if (cancelled) return;
      if (res.statusCode !== 1) return;
      const inventoryIds = new Set(
        (data.product.Variants ?? []).map((v: VariantInterface) => Number(v.InventoryId)),
      );
      const match = (res.result as WishlistItemInterface[]).find(
        w => inventoryIds.has(w.InventoryID),
      );
      if (match) { setWishlisted(true); setWishlistItemCode(match.WishlistCode); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [data, profileCode]);

  // Related products fetch
  useEffect(() => {
    if (!data?.product) return;
    const raw = data.product.RelatedProducts;
    if (!raw) return;
    const ids = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return;
    let cancelled = false;
    Promise.all(ids.map(id => getProductByItemId(id).then(r => r.result as ProductDetailInterface).catch(() => null)))
      .then(results => {
        if (cancelled) return;
        setRelatedProducts(results.filter(Boolean) as ProductDetailInterface[]);
      });
    return () => { cancelled = true; };
  }, [data]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const productDetails = data?.product ?? null;
  const variantDetails = productDetails?.Variants ?? [];
  const selectedVariant = variantDetails.find(v => String(v.InventoryId) === selectedVariantId) ?? variantDetails[0] ?? null;

  const imageUrls: string[] = productDetails?.Images
    ? (Array.isArray(productDetails.Images)
        ? (productDetails.Images as unknown as string[])
        : productDetails.Images.split(/[,;]/).map(s => s.trim())
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
            : product?.Images?.split(/[,;]/)[0]?.trim() ?? '',
          organisationId: getOrgIdForInventory(inventoryId) ?? '',
        });
        setCartCount((prev: number) => prev + quantity);
      }

      haptic.success();
      Animated.sequence([
        Animated.spring(badgeScale, { toValue: Motion.badgePopScale, ...Motion.spring.snap }),
        Animated.spring(badgeScale, { toValue: 1, ...Motion.spring.settle }),
      ]).start();
      toast.success({ title: 'Added to bag' });
    } catch {
      haptic.warning();
      toast.error({ title: "Couldn't add to bag", description: 'Check your connection and try again.' });
    } finally {
      setAddingToCart(false);
    }
  }, [profileCode, selectedVariantId, data, quantity, haptic, badgeScale, setCartCount, isOOS, isBackorder, toast]);

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
        wishlistCache.invalidate();
      } else {
        const res = await addToWishlist(profileCode, inventoryId).catch(() => null);
        if (res?.statusCode !== 1) {
          haptic.warning();
          toast.warning({ title: 'Wishlist', description: res?.userMessage ?? 'Something went wrong.' });
          return;
        }
        if (res?.statusCode === 1) {
          wishlistCache.invalidate();
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
                failedImages.has(url) ? (
                  <View key={i} style={[styles.heroPlaceholder, { width: SCREEN_W, height: HERO_H }]} />
                ) : (
                  <HeroImage
                    key={i}
                    uri={url}
                    width={SCREEN_W}
                    height={HERO_H}
                    onError={() => setFailedImages(prev => new Set(prev).add(url))}
                  />
                )
              ))}
            </ScrollView>
          ) : imageUrls.length === 1 && !failedImages.has(imageUrls[0]) ? (
            <HeroImage
              uri={imageUrls[0]}
              width={SCREEN_W}
              height={HERO_H}
              onError={() => setFailedImages(prev => new Set(prev).add(imageUrls[0]))}
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
              {/* Brand eyebrow — seller info moved to SellerCard lower on the page */}
              {productDetails.BrandName ? (
                <View style={styles.eyebrowRow}>
                  <Text style={styles.eyebrowBrand}>
                    {productDetails.BrandName.toUpperCase()}
                  </Text>
                </View>
              ) : null}

              {/* Product name + condition badge inline */}
              <View style={styles.nameBadgeRow}>
                <Text style={styles.productName}>{productDetails.Name}</Text>
                {conditionLabel ? (
                  <View style={[styles.conditionBadge, styles.conditionBadgeInline]}>
                    <Text style={styles.conditionText}>{conditionLabel}</Text>
                  </View>
                ) : null}
              </View>

              {/* Price row */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>MUR {activePrice.toFixed(0)}</Text>
                {hasDiscount ? (
                  <>
                    <Text style={styles.comparePrice}>
                      MUR {activeComparePrice.toFixed(0)}
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
          <TrustCardRow policy={productDetails.PolicyInfo} />
        ) : null}

        {/* Description + specs as accordions */}
        <ProductSpecs
          description={productDetails?.Description}
          color={productDetails?.AdditionalInfo?.Color}
          material={productDetails?.AdditionalInfo?.MaterialComposition}
          care={productDetails?.AdditionalInfo?.CareInstructions}
          weight={selectedVariant?.PhysicalAttributes?.Weight ?? null}
          weightUnit={selectedVariant?.PhysicalAttributes?.WeightUnit?.Description ?? null}
          season={(productDetails?.AdditionalInfo?.Season as any)?.Description ?? null}
          demographic={(productDetails?.AdditionalInfo?.ProductDemoGraphic as any)?.Description ?? null}
        />

        {/* Related products — reuses ProductCard for consistent image fit, corners, pricing */}
        {relatedProducts.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedHeading}>YOU MAY ALSO LIKE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
              {relatedProducts.map(p => (
                <ProductCard
                  key={p.ItemId}
                  product={mapRelatedProductToCard(p)}
                  cardWidth={140}
                  onPress={() => navigation.navigate('Product', { product: String(p.ItemId) })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Seller card */}
        <SellerCard
          sellerName={productDetails?.OrganisationName}
          manufacturer={productDetails?.ProductClassification?.Manufacturer}
          countryOfOrigin={productDetails?.ProductClassification?.CountryOfOrigin}
        />

        <View style={{ height: 8, backgroundColor: Colors.surface }} />
      </Animated.ScrollView>

      {/* ── Purchase bar ──────────────────────────────────────────────────── */}
      {isOOS ? (
        <View
          style={[
            styles.purchaseBarOOS,
            { paddingBottom: Math.max(insets.bottom, Space[4]) },
            Shadow.sm,
          ]}
        >
          <View style={styles.oosDisabledPill}>
            <Text style={styles.oosDisabledText}>Out of Stock</Text>
          </View>
          <TouchableOpacity
            style={styles.oosSecondaryBtn}
            onPress={() => navigation.navigate('Result', {
              categoryId:   productDetails?.CategoryId,
              categoryName: productDetails?.CategoryName ?? 'Similar Products',
            })}
            activeOpacity={0.7}
          >
            <Text style={styles.oosSecondaryText}>Browse Similar Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.purchaseBar,
            { paddingBottom: Math.max(insets.bottom, Space[3]) },
            Shadow.sm,
          ]}
        >
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
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Add to Bag"
              loading={addingToCart}
              onPress={handleAddToCart}
              isDisabled={false}
              height={44}
            />
          </View>
        </View>
      )}

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
    backgroundColor: '#FFFFFF',
  },
  heroPlaceholder: {
    backgroundColor: '#FFFFFF',
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
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  // ── Identity plate ─────────────────────────────────────────────────────────
  identityPlate: {
    paddingHorizontal: Space[4],
    paddingTop:        Space[4],
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surfaceSoft,
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
  productName: {
    fontFamily:    FontFamily.sans,
    fontSize:      20,
    fontWeight:    '600',
    color:         Colors.ink1,
    lineHeight:    20 * 1.25,
    flexShrink:    1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    flexWrap:      'wrap',
    gap:           8,
  },
  conditionBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COND_BG,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 11,
  },
  conditionBadgeInline: {
    marginTop: 3,
    marginBottom: 0,
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
    gap: Space[3],
    marginTop: Space[1],
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
  purchaseBarOOS: {
    backgroundColor:   Colors.surface,
    borderTopWidth:    StyleSheet.hairlineWidth,
    borderTopColor:    Colors.rule,
    paddingHorizontal: Space[4],
    paddingTop:        Space[4],
    gap:               Space[3],
  },
  oosDisabledPill: {
    width:           '100%',
    height:          48,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.surfaceDeep,
    borderWidth:     1,
    borderColor:     Colors.rule,
    alignItems:      'center',
    justifyContent:  'center',
  },
  oosDisabledText: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '500',
    color:         Colors.ink4,
    letterSpacing: 0.1,
  },
  oosSecondaryBtn: {
    width:           '100%',
    height:          44,
    borderRadius:    Radius.pill,
    borderWidth:     1.5,
    borderColor:     Colors.ink1,
    alignItems:      'center',
    justifyContent:  'center',
  },
  oosSecondaryText: {
    fontFamily:  FontFamily.sans,
    fontSize:    14,
    fontWeight:  '500',
    color:       Colors.ink1,
    letterSpacing: 0.1,
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

  // ── Related products strip ──────────────────────────────────────────────────
  relatedSection: {
    paddingTop: Space[6],
    paddingBottom: Space[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.rule,
  },
  relatedHeading: {
    ...Type.label,
    color: Colors.ink3,
    paddingHorizontal: Space.screenH,
    marginBottom: Space[4],
  },
  relatedScroll: {
    paddingHorizontal: Space.screenH,
    gap: Space[3],
  },
});
