import React, { useEffect, useRef, useCallback } from 'react';
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
import { getProductsByCategory, getAllProducts } from '../api/services';
import { ProductByCategoryProductDetails } from '../api/interfaces';
import { Skeleton } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';
import { useAsyncState } from '../hooks/useAsyncState';

const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP   = Space[3];
const COL_W     = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
// Featured span card occupies full canvas width
const SPAN_W    = SCREEN_W - Space.screenH * 2;

type ResultScreenProps = {
  navigation: StackNavigationProp<any>;
};

// Deduplicate by Item_Id, keep first occurrence (lowest Inventory_Id / first variant)
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

// Every 5th item (0-indexed: 0, 5, 10…) is a featured span.
// Index 0 is the hero — handled separately above the grid.
function isFeaturedSpan(indexInGrid: number): boolean {
  return indexInGrid > 0 && indexInGrid % 5 === 0;
}

function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, transform: [{ translateY }] };
}

// ── Hero card — first product, full-bleed cinematic ───────────────────────────
const HeroCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
  style?: object | object[];
}> = ({ product, onPress, style }) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <TouchableOpacity style={[styles.heroCard, style]} onPress={onPress} activeOpacity={0.88}>
      <Animated.Image
        source={{ uri: product.Images?.split(';')[0] || '' }}
        style={[styles.heroCardImg, { opacity: imgOpacity }]}
        resizeMode="cover"
        onLoad={onLoad}
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.82)']}
        locations={[0, 0.2, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {hasDiscount && (
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>-{discountPct}%</Text>
        </View>
      )}
      <View style={styles.heroFooter}>
        <View style={styles.heroFooterLeft}>
          {product.Brand_Name ? (
            <Text style={styles.heroCardBrand}>{product.Brand_Name}</Text>
          ) : null}
          <Text style={styles.heroCardName} numberOfLines={1}>{product.Name}</Text>
          <View style={styles.heroPriceRow}>
            <Text style={styles.heroCardPrice}>${product.Price.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.heroCardWas}>${product.ComparePrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
        <View style={styles.heroViewBtn}>
          <Text style={styles.heroViewBtnText}>View</Text>
          <Icon name="arrow-forward" size={11} color="#0A0A0A" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Standard 2-column tile ────────────────────────────────────────────────────
const GridTile: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
  delay: number;
}> = ({ product, onPress, delay }) => {
  const animStyle  = useEntrance(delay);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <Animated.View style={[styles.gridTile, animStyle]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        <View style={styles.gridImgWrap}>
          <Animated.Image
            source={{ uri: product.Images?.split(';')[0] || '' }}
            style={[styles.gridImg, { opacity: imgOpacity }]}
            resizeMode="cover"
            onLoad={onLoad}
          />
          {hasDiscount && (
            <View style={styles.gridBadge}>
              <Text style={styles.gridBadgeText}>-{discountPct}%</Text>
            </View>
          )}
        </View>
        <View style={styles.gridInfo}>
          {product.Brand_Name ? (
            <Text style={styles.gridBrand} numberOfLines={1}>{product.Brand_Name}</Text>
          ) : null}
          <Text style={styles.gridName} numberOfLines={2}>{product.Name}</Text>
          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>${product.Price.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.gridWas}>${product.ComparePrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Featured span card — full-width within grid ────────────────────────────────
const SpanCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onPress: () => void;
  delay: number;
}> = ({ product, onPress, delay }) => {
  const animStyle  = useEntrance(delay);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  return (
    <Animated.View style={[styles.spanCard, animStyle]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.88}>
        <Animated.Image
          source={{ uri: product.Images?.split(';')[0] || '' }}
          style={[styles.spanImg, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']}
          locations={[0.3, 0.7, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {hasDiscount && (
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>-{discountPct}%</Text>
          </View>
        )}
        <View style={styles.spanFooter}>
          {product.Brand_Name ? (
            <Text style={styles.spanBrand}>{product.Brand_Name}</Text>
          ) : null}
          <Text style={styles.spanName} numberOfLines={1}>{product.Name}</Text>
          <Text style={styles.spanPrice}>${product.Price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const ResultScreen: React.FC<ResultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const {
    categoryId,
    categoryName = 'Browse',
    flashDeals: isFlashDeals = false,
  } = route.params as { categoryId?: string; categoryName?: string; flashDeals?: boolean };

  const { data: products, loading, isError, error, run } = useAsyncState<ProductByCategoryProductDetails[]>([]);

  const headerAnim = useEntrance(40);
  const heroAnim   = useEntrance(140);

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

  // Build rows: pairs of grid tiles, with span cards injected at featured intervals
  // gridProducts indices: 0,1 → row; 2,3 → row; 4 → span; 5,6 → row; etc.
  // We use 0-based index in gridProducts; span trigger: every 4 items (indices 4,9,14…)
  const rows: Array<
    | { type: 'pair'; left: ProductByCategoryProductDetails; right?: ProductByCategoryProductDetails; leftIdx: number; rightIdx?: number }
    | { type: 'span'; product: ProductByCategoryProductDetails; idx: number }
  > = [];

  let i = 0;
  let pairIdx = 0; // counts pairs for span insertion
  while (i < gridProducts.length) {
    // Insert a span every 4 items in the grid (after 2 pairs)
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
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" translucent />

      {/* ── Dark editorial header — continues HomeScreen/ProductScreen tonal language */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + Space[2] },
          headerAnim,
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>COLLECTION</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
          </View>
          {/* Spacer to balance back btn */}
          <View style={styles.headerRight}>
            {!loading && (
              <Text style={styles.headerCount}>
                {deduplicated.length} {deduplicated.length === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Tonal bridge — dark → surfaceAlt, matching HomeScreen bridge */}
      <LinearGradient
        colors={['#0A0A0A', Colors.surfaceAlt]}
        style={styles.tonalBridge}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[10] },
        ]}
      >
        {loading ? (
          // ── Skeleton state ───────────────────────────────────────────────
          <View style={styles.skeletonWrap}>
            {/* Hero skeleton */}
            <Skeleton height={220} radius={Radius.lg} style={{ marginBottom: Space[5] }} />
            {/* Grid skeleton */}
            <View style={styles.gridRow}>
              <Skeleton height={COL_W * 1.15} width={COL_W} radius={Radius.md} />
              <Skeleton height={COL_W * 1.15} width={COL_W} radius={Radius.md} />
            </View>
            <View style={[styles.gridRow, { marginTop: Space[5] }]}>
              <View style={{ width: COL_W }}>
                <Skeleton height={COL_W} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
                <Skeleton height={10} width="55%" style={{ marginBottom: Space[1] }} />
                <Skeleton height={14} width="85%" />
              </View>
              <View style={{ width: COL_W }}>
                <Skeleton height={COL_W} width={COL_W} radius={Radius.md} style={{ marginBottom: Space[2] }} />
                <Skeleton height={10} width="40%" style={{ marginBottom: Space[1] }} />
                <Skeleton height={14} width="70%" />
              </View>
            </View>
          </View>
        ) : isError ? (
          // ── Error state ──────────────────────────────────────────────────
          <View style={styles.emptyWrap}>
            <ErrorState
              title="Couldn't load products"
              message={error ?? 'An unexpected error occurred.'}
              onRetry={() => fetchProducts()}
              retryLoading={loading}
              icon={<Icon name="bag-outline" size={32} color={Colors.ink3} />}
            />
          </View>
        ) : deduplicated.length === 0 ? (
          // ── Empty state ──────────────────────────────────────────────────
          <View style={styles.emptyWrap}>
            <Icon name="bag-outline" size={40} color={Colors.ink5} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>This collection is empty. Check back soon.</Text>
          </View>
        ) : (
          // ── Content ──────────────────────────────────────────────────────
          <>
            {/* Hero — first product */}
            {heroProduct && (
              <Animated.View style={heroAnim}>
                <HeroCard
                  product={heroProduct}
                  onPress={() => navigateToProduct(heroProduct.Inventory_Id)}
                  style={styles.heroCardContainer}
                />
              </Animated.View>
            )}

            {/* Hairline breath before grid */}
            <View style={styles.gridDivider} />

            {/* Grid rows */}
            {rows.map((row, rowIndex) => {
              if (row.type === 'span') {
                const delay = Math.min(160 + rowIndex * 40, 400);
                return (
                  <SpanCard
                    key={`span-${row.idx}`}
                    product={row.product}
                    onPress={() => navigateToProduct(row.product.Inventory_Id)}
                    delay={delay}
                  />
                );
              }

              const leftDelay  = Math.min(160 + rowIndex * 35, 400);
              const rightDelay = Math.min(160 + rowIndex * 35 + 60, 440);

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
    backgroundColor: '#0A0A0A',
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    paddingHorizontal: Space[3],
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 1.8,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  headerCount: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: 'rgba(255,255,255,0.35)',
  },

  // Tonal bridge
  tonalBridge: {
    height: 56,
    marginTop: -1,
    zIndex: 1,
  },

  // ── Scroll canvas ────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    marginTop: -1,
  },
  scrollContent: {
    paddingHorizontal: Space.screenH,
    paddingTop: Space[1],
  },

  // ── Hero card ────────────────────────────────────────────────────────────
  heroCardContainer: {
    marginBottom: Space[1],
  },
  heroCard: {
    width: '100%',
    height: 230,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    ...Shadow.lg,
  },
  heroCardImg: {
    width: '100%',
    height: '100%',
  },
  heroBadge: {
    position: 'absolute',
    top: Space[3],
    left: Space[3],
    backgroundColor: Colors.danger,
    borderRadius: Radius.xs,
    paddingVertical: 3,
    paddingHorizontal: Space[2],
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Space[4],
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroFooterLeft: {
    flex: 1,
    gap: 3,
    paddingRight: Space[3],
  },
  heroCardBrand: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heroCardName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[2],
    marginTop: 2,
  },
  heroCardPrice: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  heroCardWas: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.38)',
    textDecorationLine: 'line-through',
  },
  heroViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Space[3],
  },
  heroViewBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#0A0A0A',
  },

  // ── Grid divider breath ──────────────────────────────────────────────────
  gridDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.line,
    marginVertical: Space[5],
  },

  // ── Grid row ─────────────────────────────────────────────────────────────
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Space[5],
  },

  // ── Grid tile (2-col) ────────────────────────────────────────────────────
  gridTile: {
    width: COL_W,
  },
  gridImgWrap: {
    width: COL_W,
    height: COL_W * 1.1,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridBadge: {
    position: 'absolute',
    top: Space[2],
    left: Space[2],
    backgroundColor: Colors.danger,
    borderRadius: Radius.xs,
    paddingVertical: 2,
    paddingHorizontal: Space[1],
  },
  gridBadgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  gridInfo: {
    paddingTop: Space[2],
    paddingHorizontal: 2,
    gap: 2,
  },
  gridBrand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  gridName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: FontSize.sm * 1.35,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space[1],
    marginTop: 2,
  },
  gridPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
  },
  gridWas: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
    textDecorationLine: 'line-through',
  },

  // ── Span card (full-width featured) ─────────────────────────────────────
  spanCard: {
    width: SPAN_W,
    height: 210,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    marginBottom: Space[5],
    ...Shadow.md,
  },
  spanImg: {
    width: '100%',
    height: '100%',
  },
  spanFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Space[4],
    gap: 2,
  },
  spanBrand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  spanName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  spanPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.78)',
  },

  // ── Skeleton state ────────────────────────────────────────────────────────
  skeletonWrap: {
    paddingTop: Space[3],
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Space[12] + Space[8],
    gap: Space[3],
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.ink2,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.ink4,
    textAlign: 'center',
    paddingHorizontal: Space[8],
    lineHeight: FontSize.sm * 1.5,
  },
});

export default ResultScreen;
