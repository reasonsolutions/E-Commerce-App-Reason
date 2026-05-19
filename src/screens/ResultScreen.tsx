import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getProductsByCategory, getAllProducts } from '../api/product';
import { ProductByCategoryProductDetails } from '../api/interfaces';
import { Skeleton, Price, EmptyState, DarkHeader } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useEffect } from 'react';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP = Space[3];
const COL_W   = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
const SPAN_W  = SCREEN_W - Space.screenH * 2;

// 4:5 portrait aspect — canonical card ratio across all Phase 2/3 screens
const GRID_IMG_H = COL_W * 1.25;
const SPAN_IMG_H = SPAN_W * 0.58;
const HERO_IMG_H = SCREEN_W * 0.56;

type ResultScreenProps = {
  navigation: StackNavigationProp<any>;
};

function deduplicateProducts(
  products: ProductByCategoryProductDetails[],
): ProductByCategoryProductDetails[] {
  const seen = new Set<number>();
  return products.filter(p => {
    if (seen.has(p.Item_Id)) return false;
    seen.add(p.Item_Id);
    return true;
  });
}

function isFeaturedSpan(indexInGrid: number): boolean {
  return indexInGrid > 0 && indexInGrid % 5 === 0;
}

// ── Ember discount badge — shared across all three card types ─────────────────
const DiscountBadge: React.FC<{ pct: number }> = ({ pct }) => (
  <View style={styles.discountBadge}>
    <Text style={styles.discountBadgeText}>−{pct}%</Text>
  </View>
);

// ── Hero card — first product, cinematic full-bleed ───────────────────────────
const HeroCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
}> = ({ product, onPress }) => {
  const haptic    = useHaptic();
  const { animatedStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:         1,
      duration:        Motion.duration.carry,
      easing:          Motion.easing.inOut,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <Animated.View style={[styles.heroCard, animatedStyle]}>
      <TouchableOpacity
        {...handlers}
        onPress={() => { haptic.light(); onPress(); }}
        activeOpacity={1}
      >
        <View style={styles.heroImgWrap}>
          <Animated.Image
            source={{ uri: product.Images?.split(';')[0] || '' }}
            style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
            resizeMode="cover"
            onLoad={onLoad}
          />
        </View>
        {/* Gradient only for text legibility — starts from 40% down */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(8,8,8,0.38)', 'rgba(8,8,8,0.78)']}
          locations={[0, 0.35, 0.65, 1]}
          style={[StyleSheet.absoluteFillObject, { height: HERO_IMG_H }]}
          pointerEvents="none"
        />
        {hasDiscount && (
          <View style={styles.heroBadgeWrap}>
            <DiscountBadge pct={discountPct} />
          </View>
        )}
        <View style={styles.heroFooter}>
          <View style={styles.heroFooterLeft}>
            {product.Brand_Name ? (
              <Text style={styles.heroCardBrand}>{product.Brand_Name.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.heroCardName} numberOfLines={1}>{product.Name}</Text>
            <View style={styles.heroPriceRow}>
              {/* White-on-dark context — cannot use Price component */}
              <Text style={styles.heroCardPrice}>${product.Price.toFixed(2)}</Text>
              {hasDiscount && (
                <Text style={styles.heroCardWas}>${product.ComparePrice.toFixed(2)}</Text>
              )}
            </View>
          </View>
          {/* Underlined text CTA — matches frozen screen secondary action pattern */}
          <View style={styles.heroViewLink}>
            <Text style={styles.heroViewLinkText}>View</Text>
            <View style={styles.heroViewLinkUnderline} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Standard 2-column grid tile ───────────────────────────────────────────────
const GridTile: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
  delay: number;
}> = ({ product, onPress, delay }) => {
  const haptic    = useHaptic();
  const { animatedStyle: entranceStyle } = { animatedStyle: useEntrance(delay, false, 12) };
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:         1,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <Animated.View style={[styles.gridTile, entranceStyle]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          onPress={() => { haptic.light(); onPress(); }}
          activeOpacity={1}
        >
          <View style={styles.gridImgWrap}>
            <Animated.Image
              source={{ uri: product.Images?.split(';')[0] || '' }}
              style={[styles.gridImg, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
            {hasDiscount && (
              <View style={styles.gridBadgeWrap}>
                <DiscountBadge pct={discountPct} />
              </View>
            )}
          </View>
          <View style={styles.gridInfo}>
            {product.Brand_Name ? (
              <Text style={styles.gridBrand} numberOfLines={1}>
                {product.Brand_Name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.gridName} numberOfLines={2}>{product.Name}</Text>
            {/* Light-surface context — Price component is safe here */}
            <Price
              value={product.Price}
              was={hasDiscount ? product.ComparePrice : undefined}
              size="sm"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ── Featured span card — full-width editorial break ───────────────────────────
const SpanCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
  delay: number;
}> = ({ product, onPress, delay }) => {
  const haptic    = useHaptic();
  const entranceStyle = useEntrance(delay, false, 12);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:         1,
      duration:        Motion.duration.carry,
      easing:          Motion.easing.inOut,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <Animated.View style={[styles.spanCard, entranceStyle]}>
      <Animated.View style={[{ flex: 1 }, pressStyle]}>
        <TouchableOpacity
          {...handlers}
          onPress={() => { haptic.light(); onPress(); }}
          activeOpacity={1}
          style={{ flex: 1 }}
        >
          <View style={styles.spanImgWrap}>
            <Animated.Image
              source={{ uri: product.Images?.split(';')[0] || '' }}
              style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(8,8,8,0.48)', 'rgba(8,8,8,0.80)']}
            locations={[0.28, 0.65, 1]}
            style={[StyleSheet.absoluteFillObject, { height: SPAN_IMG_H }]}
            pointerEvents="none"
          />
          {hasDiscount && (
            <View style={styles.spanBadgeWrap}>
              <DiscountBadge pct={discountPct} />
            </View>
          )}
          <View style={styles.spanFooter}>
            {product.Brand_Name ? (
              <Text style={styles.spanBrand}>{product.Brand_Name.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.spanName} numberOfLines={1}>{product.Name}</Text>
            {/* White-on-dark overlay — inline price required */}
            <Text style={styles.spanPrice}>${product.Price.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ── Skeleton — matches loaded layout shape ────────────────────────────────────
const ResultSkeleton: React.FC = () => (
  <View style={styles.skeletonWrap}>
    <Skeleton height={HERO_IMG_H} radius={Radius.md} style={{ marginBottom: Space[6] }} />
    <View style={styles.gridRow}>
      <View style={{ width: COL_W }}>
        <Skeleton height={GRID_IMG_H} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
        <Skeleton height={9} width="45%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="80%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={12} width="35%" />
      </View>
      <View style={{ width: COL_W }}>
        <Skeleton height={GRID_IMG_H} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
        <Skeleton height={9} width="55%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="70%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
    <View style={[styles.gridRow, { marginTop: Space[5] }]}>
      <View style={{ width: COL_W }}>
        <Skeleton height={GRID_IMG_H} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
        <Skeleton height={9} width="38%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="85%" />
      </View>
      <View style={{ width: COL_W }}>
        <Skeleton height={GRID_IMG_H} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
        <Skeleton height={9} width="50%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="65%" />
      </View>
    </View>
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────────
const ResultScreen: React.FC<ResultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route  = useRoute();
  const {
    categoryId,
    categoryName = 'Browse',
    flashDeals: isFlashDeals = false,
  } = route.params as { categoryId?: string; categoryName?: string; flashDeals?: boolean };

  const { data: products, loading, isError, error, run } = useAsyncState<ProductByCategoryProductDetails[]>([]);

  const headerAnim = useEntrance(40, false, 12);
  const heroAnim   = useEntrance(160, false, 12);

  const fetchProducts = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        if (isFlashDeals) {
          const data = await getAllProducts();
          if (data?.statusCode === 1) {
            const discounted = (data.result || []).filter(
              (p: any) => p.ComparePrice > p.Price,
            ) as unknown as ProductByCategoryProductDetails[];
            return deduplicateProducts(discounted);
          }
          return [];
        } else {
          const data = await getProductsByCategory(categoryId ?? '');
          if (data?.statusCode === 1) {
            return deduplicateProducts(data.result.productsDetails || []);
          }
          return [];
        }
      }, cancelled),
    [run, categoryId, isFlashDeals],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchProducts(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchProducts]);

  const deduplicated = products ?? [];
  const heroProduct  = deduplicated[0] ?? null;
  const gridProducts = deduplicated.slice(1);

  const rows: Array<
    | { type: 'pair'; left: ProductByCategoryProductDetails; right?: ProductByCategoryProductDetails; leftIdx: number; rightIdx?: number }
    | { type: 'span'; product: ProductByCategoryProductDetails; idx: number }
  > = [];

  let i = 0;
  let pairIdx = 0;
  while (i < gridProducts.length) {
    if (pairIdx > 0 && pairIdx % 2 === 0 && isFeaturedSpan(i)) {
      rows.push({ type: 'span', product: gridProducts[i], idx: i });
      i++;
      pairIdx = 0;
      continue;
    }
    const left  = gridProducts[i];
    const right = gridProducts[i + 1];
    rows.push({ type: 'pair', left, right, leftIdx: i, rightIdx: right ? i + 1 : undefined });
    i += right ? 2 : 1;
    pairIdx++;
  }

  const navigateToProduct = useCallback(
    (inventoryId: number) => navigation.navigate('Product', { product: inventoryId }),
    [navigation],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      <Animated.View style={[styles.headerWrap, headerAnim]}>
        <DarkHeader
          eyebrow="COLLECTION"
          title={categoryName}
          onBack={() => navigation.goBack()}
          paddingTop={insets.top + Space[2]}
          rightSlot={
            !loading && deduplicated.length > 0
              ? <Text style={styles.headerCount}>{deduplicated.length}</Text>
              : undefined
          }
        />
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[10] },
        ]}
      >
        {loading ? (
          <ResultSkeleton />
        ) : isError ? (
          <View style={styles.stateWrap}>
            <ErrorState
              title="Couldn't load products"
              message={error ?? 'Something went wrong.'}
              onRetry={() => fetchProducts()}
              retryLoading={loading}
            />
          </View>
        ) : deduplicated.length === 0 ? (
          <View style={styles.stateWrap}>
            <EmptyState
              icon={<Icon name="bag-outline" size={28} color={Colors.ink4} />}
              title="Nothing here yet."
              body="This collection is empty. Check back soon."
            />
          </View>
        ) : (
          <>
            {heroProduct && (
              <Animated.View style={heroAnim}>
                <HeroCard
                  product={heroProduct}
                  onPress={() => navigateToProduct(heroProduct.Inventory_Id)}
                />
              </Animated.View>
            )}

            {/* Hairline divider — breath between hero and grid */}
            <View style={styles.gridDivider} />

            {rows.map((row, rowIndex) => {
              if (row.type === 'span') {
                const delay = Math.min(180 + rowIndex * 40, 420);
                return (
                  <SpanCard
                    key={`span-${row.idx}`}
                    product={row.product}
                    onPress={() => navigateToProduct(row.product.Inventory_Id)}
                    delay={delay}
                  />
                );
              }

              const leftDelay  = Math.min(180 + rowIndex * 35, 400);
              const rightDelay = Math.min(180 + rowIndex * 35 + 55, 440);

              return (
                <View key={`pair-${row.leftIdx}`} style={styles.gridRow}>
                  <GridTile
                    product={row.left}
                    onPress={() => navigateToProduct(row.left.Inventory_Id)}
                    delay={leftDelay}
                  />
                  {row.right ? (
                    <GridTile
                      product={row.right}
                      onPress={() => navigateToProduct(row.right!.Inventory_Id)}
                      delay={rightDelay}
                    />
                  ) : (
                    <View style={{ width: COL_W }} />
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.ink1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerWrap: {
    zIndex: 2,
  },
  headerCount: {
    fontFamily:    FontFamily.mono,
    fontSize:      11,
    color:         'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
  },

  // ── Scroll canvas ────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop: Space[5],
  },

  // ── Hero card ────────────────────────────────────────────────────────────────
  heroCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDeep,
    marginBottom: Space[1],
  },
  heroImgWrap: {
    width: '100%',
    height: HERO_IMG_H,
    backgroundColor: Colors.surfaceDeep,
  },
  heroBadgeWrap: {
    position: 'absolute',
    top: Space[3],
    left: Space[3],
  },
  heroFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Space[5],
    paddingBottom: Space[5],
    paddingTop: Space[4],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroFooterLeft: {
    flex: 1,
    gap: 4,
    paddingRight: Space[4],
  },
  heroCardBrand: {
    ...Type.label,
    color: 'rgba(255,255,255,0.46)',
  },
  heroCardName: {
    fontFamily: FontFamily.serif,
    fontSize:   20,
    fontWeight: '400',
    color:      '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 20 * 1.2,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Space[2],
    marginTop: 2,
  },
  heroCardPrice: {
    fontFamily: FontFamily.serif,
    fontSize:   18,
    fontWeight: '400',
    color:      '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroCardWas: {
    fontFamily: FontFamily.mono,
    fontSize:   12,
    color:      'rgba(255,255,255,0.36)',
    textDecorationLine: 'line-through',
  },
  // Underlined text link — matches frozen secondary action pattern
  heroViewLink: {
    alignItems: 'center',
    paddingBottom: 2,
  },
  heroViewLinkText: {
    ...Type.caption,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.2,
  },
  heroViewLinkUnderline: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.32)',
    marginTop: 2,
  },

  // ── Ember discount badge ──────────────────────────────────────────────────────
  discountBadge: {
    backgroundColor: Colors.accentTint,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.xs,
    paddingVertical: 2,
    paddingHorizontal: Space[2],
  },
  discountBadgeText: {
    ...Type.label,
    color: Colors.accent,
    letterSpacing: 0.8,
  },

  // ── Grid divider ─────────────────────────────────────────────────────────────
  gridDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
    marginVertical: Space[6],
  },

  // ── Grid row ──────────────────────────────────────────────────────────────────
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Space[6],
  },

  // ── Grid tile ─────────────────────────────────────────────────────────────────
  gridTile: {
    width: COL_W,
  },
  gridImgWrap: {
    width: COL_W,
    height: GRID_IMG_H,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDeep,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridBadgeWrap: {
    position: 'absolute',
    top: Space[2],
    left: Space[2],
  },
  gridInfo: {
    paddingTop: Space[2],
    paddingHorizontal: 1,
    gap: 3,
  },
  gridBrand: {
    ...Type.label,
    color: Colors.ink4,
  },
  gridName: {
    fontFamily: FontFamily.serif,
    fontSize:   14,
    fontWeight: '400',
    color:      Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: 14 * 1.35,
  },

  // ── Span card ─────────────────────────────────────────────────────────────────
  spanCard: {
    width: SPAN_W,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDeep,
    marginBottom: Space[6],
  },
  spanImgWrap: {
    width: '100%',
    height: SPAN_IMG_H,
    backgroundColor: Colors.surfaceDeep,
  },
  spanBadgeWrap: {
    position: 'absolute',
    top: Space[3],
    left: Space[4],
  },
  spanFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Space[5],
    paddingBottom: Space[5],
    gap: 3,
  },
  spanBrand: {
    ...Type.label,
    color: 'rgba(255,255,255,0.44)',
  },
  spanName: {
    fontFamily: FontFamily.serif,
    fontSize:   18,
    fontWeight: '400',
    color:      '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 18 * 1.2,
  },
  // White-on-dark — inline price required (no Price component)
  spanPrice: {
    fontFamily: FontFamily.serif,
    fontSize:   15,
    fontWeight: '400',
    color:      'rgba(255,255,255,0.75)',
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  skeletonWrap: {
    paddingTop: Space[2],
  },

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
    paddingTop: Space[12] + Space[6],
  },
});

export default ResultScreen;
