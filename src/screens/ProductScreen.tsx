import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Box,
  Text,
  HStack,
  VStack,
  Pressable,
  ScrollView,
  Divider,
  Image,
} from '../components/primitives';
import { FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { ProductDetailInterface, VariantInterface, PostCartSaveInterface } from '../api/interfaces';
import { postSaveCartItems, selectProduct, addToWishlist, removeFromWishlist, getWishlist } from '../api/services';
import {
  QuantityStepper,
  Skeleton,
  SkeletonRow,
  ErrorBanner,
  PrimaryButton,
  TextLinkButton,
  ProductIdentity,
  HeroNavButton,
  VariantSheet,
  type VariantOption,
} from '../components/ui';
import { Colors, Space, Shadow } from '../theme';
import { Type } from '../theme/typography';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useCart } from '../context/CartContext';
import { useHaptic } from '../hooks/useHaptic';
import { useAppToast } from '../hooks/useAppToast';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_H = Math.round(SCREEN_H * 0.58);

type ProductFetch = {
  product: ProductDetailInterface;
  variants: VariantInterface[];
};

type ProductScreenProps = {
  navigation: { goBack: () => void; navigate: (screen: string) => void };
  route: { params?: { product?: string } };
};

const ProductScreen: React.FC<ProductScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { setCartCount } = useCart();
  const haptic = useHaptic();
  const toast = useAppToast();

  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState<boolean>(false);
  const [wishlistItemCode, setWishlistItemCode] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [variantSheetOpen, setVariantSheetOpen] = useState<boolean>(false);

  const plateAnim      = useRef(new Animated.Value(0)).current;
  const heroImgOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale     = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (!data) return;
    Animated.timing(plateAnim, {
      toValue: 1, duration: Motion.duration.settle, delay: 60,
      easing: Motion.easing.out, useNativeDriver: true,
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
          if (match) { setWishlisted(true); setWishlistItemCode(match.WishlistItemCode); }
        }
      }).catch(() => {});
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleHeroImageLoad = useCallback(() => {
    Animated.timing(heroImgOpacity, {
      toValue: 1, duration: Motion.duration.carry,
      easing: Motion.easing.inOut, useNativeDriver: true,
    }).start();
  }, [heroImgOpacity]);

  const handleAddToCart = useCallback(async () => {
    const requestbody: PostCartSaveInterface = {
      CustomerLoginCode: null,
      CustomerProfileCode: profileCode!,
      Inventory_Id: selectedVariant ? parseInt(selectedVariant) : (data?.product?.Inventory_Id ?? 0),
      BranchCode: null, CountryCode: null,
      Quantity: quantity, SpecialRemarks: '',
    };
    try {
      setAddingToCart(true);
      await postSaveCartItems(requestbody);
      setCartCount((prev: number) => prev + quantity);
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
  }, [profileCode, selectedVariant, data, quantity, haptic, toast, badgeScale, setCartCount, navigation]);

  const handleWishlistToggle = useCallback(async () => {
    if (!profileCode) return;
    haptic.light();
    const inventoryId = Number(route?.params?.product ?? 0);
    if (wishlisted && wishlistItemCode !== null) {
      await removeFromWishlist(profileCode, wishlistItemCode).catch(() => {});
      setWishlisted(false); setWishlistItemCode(null);
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
  const variantOptions: VariantOption[] = variantDetails.map(v => ({
    id: String(v.Inventory_Id),
    label: v.Variant,
    outOfStock: v.Count === 0,
  }));
  const imageUri       = productDetails?.Images ? productDetails.Images.split(';')[selectedImageIndex] : undefined;
  const imageThumbs    = productDetails?.Images ? productDetails.Images.split(';').filter(Boolean) : [];
  const hasDiscount    = productDetails ? productDetails.ComparePrice > productDetails.Price : false;
  const discountPct    = hasDiscount && productDetails
    ? Math.round(((productDetails.ComparePrice - productDetails.Price) / productDetails.ComparePrice) * 100) : 0;

  const plateStyle = {
    opacity: plateAnim,
    transform: [{ translateY: plateAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  const renderThumb = useCallback(({ item, index }: { item: string; index: number }) => (
    <Pressable
      onPress={() => { haptic.light(); setSelectedImageIndex(index); }}
      style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.surfaceDeep }}
    >
      <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} alt="" resizeMode="cover" />
      {selectedImageIndex === index && (
        <Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.ink1 }} />
      )}
    </Pressable>
  ), [selectedImageIndex, haptic]);

  return (
    <Box className="flex-1 bg-surface">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {isError ? (
        <Box
          className="flex-1 bg-surface px-5"
          style={{ paddingTop: insets.top + Space[12] }}
        >
          <HeroNavButton
            icon="chevron-back"
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
            iconColor={Colors.ink1}
          />
          <ErrorBanner
            title="Couldn't load product"
            body={error ?? 'Check your connection and try again.'}
            onRetry={() => fetchProduct()}
          />
        </Box>
      ) : (
        <>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Space[8] }}>

            {/* ── Hero ─────────────────────────────────────────────────── */}
            <Box
              className="overflow-hidden bg-surfaceDeep"
              style={{ height: HERO_H, width: SCREEN_W }}
            >
              {productDetails ? (
                <Animated.Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: '100%', opacity: heroImgOpacity }}
                  resizeMode="cover"
                  onLoad={handleHeroImageLoad}
                />
              ) : (
                <Box className="absolute inset-0 bg-surfaceDeep" />
              )}

              <LinearGradient
                colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0.0)']}
                locations={[0, 0.28]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
              />

              {/* Floating nav */}
              <HStack
                className="absolute left-0 right-0 px-5 justify-between items-center"
                style={{ top: 0, paddingTop: insets.top + Space[2] }}
              >
                <HeroNavButton
                  icon="chevron-back"
                  onPress={() => navigation.goBack()}
                  accessibilityLabel="Go back"
                />

                <HStack style={{ gap: Space[2] }}>
                  <HeroNavButton
                    icon={wishlisted ? 'heart' : 'heart-outline'}
                    onPress={handleWishlistToggle}
                    accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    iconColor={wishlisted ? Colors.accent : '#FFFFFF'}
                  />
                  <HeroNavButton
                    icon="bag-outline"
                    onPress={() => navigation.navigate('Cart')}
                    accessibilityLabel="View cart"
                  >
                    <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                      <Icon name="bag-outline" size={20} color="#FFFFFF" />
                    </Animated.View>
                  </HeroNavButton>
                </HStack>
              </HStack>

              {/* Discount badge */}
              {hasDiscount && (
                <Box
                  className="absolute left-5 rounded-xs border border-accent bg-accentTint px-2"
                  style={{ top: insets.top + Space[2] + 44, paddingVertical: 3 }}
                >
                  <Text style={[Type.label, { color: Colors.accent }]}>
                    -{discountPct}%
                  </Text>
                </Box>
              )}
            </Box>

            {/* ── Thumbnail strip ───────────────────────────────────────── */}
            {imageThumbs.length > 1 && (
              <Box className="bg-surfaceSoft">
                <FlatList
                  data={imageThumbs}
                  renderItem={renderThumb}
                  keyExtractor={(_, i) => i.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: Space[5], paddingVertical: Space[3], gap: Space[2] }}
                />
              </Box>
            )}

            {/* ── Identity plate ────────────────────────────────────────── */}
            <Animated.View style={plateStyle}>
              <VStack className="bg-surface px-5 pt-5 pb-4" style={{ gap: Space[2] }}>
                <ProductIdentity
                  brand={productDetails?.Brand_Name}
                  name={productDetails?.Name ?? ''}
                  price={productDetails?.Price ?? 0}
                  comparePrice={productDetails?.ComparePrice}
                  loading={!productDetails}
                />
              </VStack>
            </Animated.View>

            <Divider className="mx-5 bg-rule" />

            {/* ── Variants + description ────────────────────────────────── */}
            <Animated.View style={plateStyle}>
              <VStack className="bg-surface px-5 pt-5" style={{ gap: Space[4] }}>
                {productDetails ? (
                  <>
                    {variantOptions.length > 0 && (
                      <Pressable
                        onPress={() => { haptic.light(); setVariantSheetOpen(true); }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: Space[3],
                          paddingHorizontal: Space[4],
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: selectedVariant ? Colors.ink1 : Colors.rule,
                          backgroundColor: Colors.surfaceSoft,
                        }}
                      >
                        <VStack style={{ gap: 2 }}>
                          <Text style={Type.label}>Variant</Text>
                          <Text style={{ fontFamily: 'JetBrainsMono-Regular', fontSize: 13, color: selectedVariant ? Colors.ink1 : Colors.ink3 }}>
                            {selectedVariant
                              ? variantOptions.find(o => o.id === selectedVariant)?.label
                              : 'Select a variant'}
                          </Text>
                        </VStack>
                        <Icon name="chevron-down" size={16} color={Colors.ink3} />
                      </Pressable>
                    )}

                    {productDetails.Description ? (
                      <>
                        <Divider className="bg-rule" />
                        <VStack style={{ gap: Space[2], marginBottom: Space[8] }}>
                          <Text style={Type.label}>Details</Text>
                          <Text
                            className="text-ink2"
                            style={{ fontSize: 16, lineHeight: 16 * 1.7 }}
                          >
                            {productDetails.Description}
                          </Text>
                        </VStack>
                      </>
                    ) : null}
                  </>
                ) : (
                  <VStack style={{ gap: Space[4], paddingBottom: Space[6] }}>
                    <Skeleton height={11} width="18%" />
                    <SkeletonRow gap={Space[2]}>
                      <Skeleton height={40} width={72} radius={8} />
                      <Skeleton height={40} width={72} radius={8} />
                      <Skeleton height={40} width={72} radius={8} />
                    </SkeletonRow>
                    <Skeleton height={14} />
                    <Skeleton height={14} />
                    <Skeleton height={14} width="70%" />
                  </VStack>
                )}
              </VStack>
            </Animated.View>
          </ScrollView>

          <VariantSheet
            isOpen={variantSheetOpen}
            onClose={() => setVariantSheetOpen(false)}
            options={variantOptions}
            selectedId={selectedVariant}
            onSelect={handleVariantSelect}
          />

          {/* ── Purchase bar ──────────────────────────────────────────── */}
          <VStack
            className="bg-surfaceDeep border-t border-rule px-5 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, Space[4]), gap: Space[2], ...Shadow.sm }}
          >
            <Box>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} size="sm" />
            </Box>
            <PrimaryButton
              label="Add to Bag"
              loading={addingToCart}
              onPress={handleAddToCart}
            />
            <TextLinkButton
              label="Buy Now"
              onPress={handleAddToCart}
            />
          </VStack>
        </>
      )}
    </Box>
  );
};

export default ProductScreen;
