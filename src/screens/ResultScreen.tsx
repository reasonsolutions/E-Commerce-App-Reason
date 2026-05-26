import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getProductsByCategory, getProductsByBrand, getAllProducts, getCategories } from '../api/product';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import { ProductByCategoryProductDetails, CategoryInterface } from '../api/interfaces';
import { Skeleton, Price, EmptyState, DarkHeader, FilterSheet, SearchBar } from '../components/ui';
import type { SortKey } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { styles, COL_W, GRID_IMG_H, SPAN_IMG_H, HERO_IMG_H } from './ResultScreen.styles';

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

function applySort(
  products: ProductByCategoryProductDetails[],
  sortKey: SortKey,
): ProductByCategoryProductDetails[] {
  if (sortKey === 'default') return products;
  const copy = [...products];
  if (sortKey === 'price_asc') {
    copy.sort((a, b) => a.Price - b.Price);
  } else if (sortKey === 'price_desc') {
    copy.sort((a, b) => b.Price - a.Price);
  } else if (sortKey === 'newest') {
    copy.sort((a, b) => {
      const da = new Date(a.Date_Created).getTime();
      const db = new Date(b.Date_Created).getTime();
      return db - da;
    });
  }
  return copy;
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
              <Text style={styles.heroCardPrice}>Rs {product.Price.toFixed(0)}</Text>
              {hasDiscount && (
                <Text style={styles.heroCardWas}>Rs {product.ComparePrice.toFixed(0)}</Text>
              )}
            </View>
          </View>
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
  const haptic        = useHaptic();
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
            <Text style={styles.spanPrice}>Rs {product.Price.toFixed(0)}</Text>
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
  const haptic = useHaptic();
  const {
    categoryId,
    brandId,
    searchQuery: searchQueryParam,
    categoryName = 'Browse',
    flashDeals: isFlashDeals = false,
  } = route.params as { categoryId?: string; brandId?: number; searchQuery?: string; categoryName?: string; flashDeals?: boolean };

  const { data: products, loading, isError, error, run } = useAsyncState<ProductByCategoryProductDetails[]>([]);

  const headerAnim = useEntrance(40, false, 12);
  const heroAnim   = useEntrance(160, false, 12);

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [filterCategories, setFilterCategories] = useState<number[]>([]);
  const [filterBrands, setFilterBrands]         = useState<number[]>([]);
  const [filterPriceMin, setFilterPriceMin]     = useState('');
  const [filterPriceMax, setFilterPriceMax]     = useState('');
  const [filterDiscount, setFilterDiscount]     = useState(false);
  const [sortKey, setSortKey]                   = useState<SortKey>('default');
  const [sheetCategories, setSheetCategories]   = useState<CategoryInterface[]>([]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [localQuery, setLocalQuery]   = useState(searchQueryParam ?? '');

  // Draft state — lives in sheet until Apply is tapped
  const [draftCategories, setDraftCategories] = useState<number[]>([]);
  const [draftBrands, setDraftBrands]         = useState<number[]>([]);
  const [draftPriceMin, setDraftPriceMin]     = useState('');
  const [draftPriceMax, setDraftPriceMax]     = useState('');
  const [draftDiscount, setDraftDiscount]     = useState(false);
  const [draftSortKey, setDraftSortKey]       = useState<SortKey>('default');

  const activeFilterCount =
    filterCategories.length +
    filterBrands.length +
    (filterPriceMin || filterPriceMax ? 1 : 0) +
    (filterDiscount ? 1 : 0);

  // ── Derived brand list from selected categories (or all if none selected) ──
  const allBrandsFromSheet = useMemo(() => {
    const source = draftCategories.length > 0
      ? sheetCategories.filter(c => draftCategories.includes(c.CategoryId))
      : sheetCategories;
    const seen = new Set<number>();
    const result: { id: number; name: string }[] = [];
    source.forEach(cat => {
      cat.Brands.forEach(b => {
        const id = Number(b.Brand_Id);
        if (!seen.has(id)) {
          seen.add(id);
          result.push({ id, name: b.Brand_Name });
        }
      });
    });
    return result;
  }, [sheetCategories, draftCategories]);

  // ── Fetch categories once on mount ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    getCategories().then(res => {
      if (!active) return;
      if (res?.statusCode === 1 && Array.isArray(res.result)) {
        setSheetCategories(res.result as CategoryInterface[]);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // ── Open sheet — sync draft from committed state ───────────────────────────
  const openSheet = useCallback(() => {
    setDraftCategories(filterCategories);
    setDraftBrands(filterBrands);
    setDraftPriceMin(filterPriceMin);
    setDraftPriceMax(filterPriceMax);
    setDraftDiscount(filterDiscount);
    setDraftSortKey(sortKey);
    setIsSheetOpen(true);
  }, [filterCategories, filterBrands, filterPriceMin, filterPriceMax, filterDiscount, sortKey]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(
    (
      opts?: {
        cats?: number[];
        brands?: number[];
        priceMin?: string;
        priceMax?: string;
        discount?: boolean;
        cancelled?: { current: boolean };
      },
    ) => {
      const cats     = opts?.cats     ?? filterCategories;
      const brands   = opts?.brands   ?? filterBrands;
      const priceMin = opts?.priceMin ?? filterPriceMin;
      const priceMax = opts?.priceMax ?? filterPriceMax;
      const discount = opts?.discount ?? filterDiscount;
      const cancelled = opts?.cancelled;

      const hasFilters =
        cats.length > 0 ||
        brands.length > 0 ||
        priceMin !== '' ||
        priceMax !== '' ||
        discount;

      return run(async () => {
        if (hasFilters) {
          // Always include the route brandId so brand-page filters stay scoped to that brand
          const effectiveBrands = brands.length > 0
            ? brands
            : brandId != null ? [Number(brandId)] : [];
          const response = await axiosInstance.post(productEndpoints.allProducts, {
            brands:        effectiveBrands,
            categories:    cats,
            subCategories: [],
            searchQuery:   searchQueryParam ?? '',
            priceRange: {
              from: priceMin !== '' ? Number(priceMin) : null,
              to:   priceMax !== '' ? Number(priceMax) : null,
            },
            discount: discount ? '%' : null,
            pagination: { pageNumber: 1, pageSize: 50 },
          });
          const mapped: ProductByCategoryProductDetails[] = (response.data?.result?.Products ?? []).map((p: any) => ({
            Item_Id:        p.ItemID,
            Name:           p.Name,
            Price:          p.MinPrice,
            ComparePrice:   p.MaxComparePrice,
            Description:    p.Description,
            SubCategory_Id: Number(p.SubcategoryID),
            Images:         p.Images,
            Date_Created:   p.CreatedDate,
            Brand_Id:       Number(p.BrandID),
            ApprovedBy:     null,
            ApprovedOn:     null,
            VendorID:       0,
            Brand_Name:     p.BrandName,
            Category_Id:    Number(p.CategoryID),
            CategoryName:   p.CategoryName,
            CategoryImage:  p.CategoryImage,
            SCName:         p.SCName,
            Inventory_Id:   p.Variants?.[0] ? Number(p.Variants[0].InventoryID) : 0,
            Variant:        p.Variants?.[0]?.Variant ?? '',
            Count:          p.Variants?.[0]?.Stock ?? 0,
            Date_Updated:   p.CreatedDate,
          }));
          return deduplicateProducts(mapped);
        }

        if (isFlashDeals) {
          const data = await getAllProducts();
          if (data?.statusCode === 1) {
            const discounted = (data.result || []).filter(
              (p: any) => p.ComparePrice > p.Price,
            ) as unknown as ProductByCategoryProductDetails[];
            return deduplicateProducts(discounted);
          }
          return [];
        } else if (searchQueryParam) {
          const response = await axiosInstance.post(productEndpoints.allProducts, {
            brands:        [],
            categories:    [],
            subCategories: [],
            searchQuery:   searchQueryParam,
            priceRange:    { from: null, to: null },
            discount:      '%',
            pagination:    { pageNumber: 1, pageSize: 20 },
          });
          const mapped: ProductByCategoryProductDetails[] = (response.data?.result?.Products ?? []).map((p: any) => ({
            Item_Id:        p.ItemID,
            Name:           p.Name,
            Price:          p.MinPrice,
            ComparePrice:   p.MaxComparePrice,
            Description:    p.Description,
            SubCategory_Id: Number(p.SubcategoryID),
            Images:         p.Images,
            Date_Created:   p.CreatedDate,
            Brand_Id:       Number(p.BrandID),
            ApprovedBy:     null,
            ApprovedOn:     null,
            VendorID:       0,
            Brand_Name:     p.BrandName,
            Category_Id:    Number(p.CategoryID),
            CategoryName:   p.CategoryName,
            CategoryImage:  p.CategoryImage,
            SCName:         p.SCName,
            Inventory_Id:   p.Variants?.[0] ? Number(p.Variants[0].InventoryID) : 0,
            Variant:        p.Variants?.[0]?.Variant ?? '',
            Count:          p.Variants?.[0]?.Stock ?? 0,
            Date_Updated:   p.CreatedDate,
          }));
          return deduplicateProducts(mapped);
        } else if (brandId != null) {
          const fetched = await getProductsByBrand(brandId);
          return deduplicateProducts(fetched);
        } else {
          const fetched = await getProductsByCategory(categoryId ?? '');
          return deduplicateProducts(fetched);
        }
      }, cancelled);
    },
    [run, categoryId, brandId, searchQueryParam, isFlashDeals, filterCategories, filterBrands, filterPriceMin, filterPriceMax, filterDiscount],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchProducts({ cancelled });
    return () => { cancelled.current = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply handler (called from sheet) ─────────────────────────────────────
  const handleApply = useCallback(() => {
    setIsSheetOpen(false);
    setFilterCategories(draftCategories);
    setFilterBrands(draftBrands);
    setFilterPriceMin(draftPriceMin);
    setFilterPriceMax(draftPriceMax);
    setFilterDiscount(draftDiscount);
    setSortKey(draftSortKey);
    fetchProducts({
      cats:     draftCategories,
      brands:   draftBrands,
      priceMin: draftPriceMin,
      priceMax: draftPriceMax,
      discount: draftDiscount,
    });
  }, [draftCategories, draftBrands, draftPriceMin, draftPriceMax, draftDiscount, draftSortKey, fetchProducts]);

  // ── Clear all draft state ──────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setDraftCategories([]);
    setDraftBrands([]);
    setDraftPriceMin('');
    setDraftPriceMax('');
    setDraftDiscount(false);
    setDraftSortKey('default');
  }, []);

  const toggleDraftCategory = useCallback((id: number) => {
    haptic.light();
    setDraftCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [haptic]);

  const toggleDraftBrand = useCallback((id: number) => {
    haptic.light();
    setDraftBrands(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [haptic]);

  // ── Rendered product list (sort applied client-side) ──────────────────────
  const deduplicated = useMemo(
    () => applySort(products ?? [], sortKey),
    [products, sortKey],
  );
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
    (itemId: number) => navigation.navigate('Product', { product: itemId }),
    [navigation],
  );

  const filterButton = (
    <TouchableOpacity
      onPress={() => { haptic.light(); openSheet(); }}
      activeOpacity={0.75}
      style={styles.filterPill}
    >
      <Icon name="options-outline" size={13} color={activeFilterCount > 0 ? Colors.accent : 'rgba(255,255,255,0.70)'} />
      <Text style={[styles.filterPillText, activeFilterCount > 0 && styles.filterPillTextActive]}>
        Filter
      </Text>
      {activeFilterCount > 0 && <View style={styles.filterDot} />}
    </TouchableOpacity>
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
          rightSlot={filterButton}
        />
      </Animated.View>

      <View style={styles.searchBand}>
        <SearchBar
          value={localQuery}
          onChangeText={setLocalQuery}
          placeholder="Search products, brands…"
          onSubmit={() => {
            const q = localQuery.trim();
            if (!q) return;
            navigation.navigate('Result', { searchQuery: q, categoryName: `"${q}"` });
          }}
        />
      </View>

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
                  onPress={() => navigateToProduct(heroProduct.Item_Id)}
                />
              </Animated.View>
            )}

            <View style={styles.gridDivider} />

            {rows.map((row, rowIndex) => {
              if (row.type === 'span') {
                const delay = Math.min(180 + rowIndex * 40, 420);
                return (
                  <SpanCard
                    key={`span-${row.idx}`}
                    product={row.product}
                    onPress={() => navigateToProduct(row.product.Item_Id)}
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
                    onPress={() => navigateToProduct(row.left.Item_Id)}
                    delay={leftDelay}
                  />
                  {row.right ? (
                    <GridTile
                      product={row.right}
                      onPress={() => navigateToProduct(row.right!.Item_Id)}
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

      <FilterSheet
        visible={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onApply={handleApply}
        draftSortKey={draftSortKey}
        setDraftSortKey={setDraftSortKey}
        draftCategories={draftCategories}
        toggleDraftCategory={toggleDraftCategory}
        draftBrands={draftBrands}
        toggleDraftBrand={toggleDraftBrand}
        draftPriceMin={draftPriceMin}
        setDraftPriceMin={setDraftPriceMin}
        draftPriceMax={draftPriceMax}
        setDraftPriceMax={setDraftPriceMax}
        draftDiscount={draftDiscount}
        setDraftDiscount={setDraftDiscount}
        onClearAll={handleClearAll}
        sheetCategories={sheetCategories}
        allBrandsFromSheet={allBrandsFromSheet}
        hideBrands={brandId != null}
      />
    </View>
  );
};

export default ResultScreen;
