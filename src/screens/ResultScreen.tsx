import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getCategories, getBrands, ON_SALE_DISCOUNT_RANGE } from '../api/product';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import {
  ProductByCategoryProductDetails,
  AllProductsRawItem,
  CategoryInterface,
  GetBrandItem,
} from '../api/interfaces';
import {
  Skeleton,
  EmptyState,
  FilterSheet,
  TextLinkButton,
  WishlistHeart,
} from '../components/ui';
import type { SortKey } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space } from '../theme';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import {
  styles,
  COL_W,
  GRID_IMG_H,
} from './ResultScreen.styles';
import { deduplicateProducts, isFeaturedSpan, toServerSortBy } from '../utils/resultHelpers';
import { useWishlist } from '../context/WishlistContext';
import { wishlistCache } from '../utils/wishlistCache';
import { isProductSoldOut, isVariantPurchasable } from '../utils/stock';
import { resultScreenCache } from './resultScreenCache';

type ResultScreenProps = {
  navigation: StackNavigationProp<any>;
};

// A list-card shows one image/price for the whole product (not per-variant),
// so it reads as sold out only when every one of its variants is unavailable —
// checking just the first variant misreports products where only that
// specific variant (e.g. one size) is out of stock while others are fine.
const isProductOOS = (product: ProductByCategoryProductDetails): boolean =>
  isProductSoldOut(product.RawVariants);

// ── Featured card — full-width, used when ≤3 results ─────────────────────────
const FeaturedCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onNavigate: (itemId: number) => void;
  delay: number;
}> = React.memo(({ product, onNavigate, delay }) => {
  const haptic = useHaptic();
  const { animatedStyle: entranceStyle } = { animatedStyle: useEntrance(delay, false, Motion.list.initialY) };
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const firstImage = product.Images ? resolveImageUrl(product.Images) : null;
  const isOOS = isProductOOS(product);

  const discountPct = product.DiscountPct ?? 0;
  const hasDiscount = !isOOS && discountPct > 0;

  return (
    <Animated.View style={[styles.featuredCard, entranceStyle]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          onPress={() => { haptic.light(); onNavigate(product.Item_Id); }}
          activeOpacity={1}
        >
          <View style={styles.featuredImgWrap}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={[styles.gridImg, isOOS && styles.oosImage]}
                resizeMode="cover"
              />
            ) : null}
            {isOOS ? (
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText} numberOfLines={1}>Sold out</Text>
              </View>
            ) : hasDiscount ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText} numberOfLines={1}>−{discountPct}%</Text>
              </View>
            ) : null}
            <WishlistHeart inventoryId={product.Inventory_Id} />
          </View>
          <View style={styles.featuredInfo}>
            {product.Brand_Name ? (
              <Text style={styles.gridBrand} numberOfLines={1}>
                {product.Brand_Name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.featuredName} numberOfLines={2}>{product.Name}</Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.featuredPrice}>Rs {product.Price.toLocaleString('en-IN')}</Text>
              {hasDiscount ? (
                <Text style={styles.heroCardWas}>Rs {product.ComparePrice.toLocaleString('en-IN')}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ── Standard 2-column grid tile ───────────────────────────────────────────────
const GridTile: React.FC<{
  product: ProductByCategoryProductDetails;
  onNavigate: (itemId: number) => void;
  delay: number;
  centered?: boolean;
}> = React.memo(({ product, onNavigate, delay, centered = false }) => {
  const onPress = useCallback(() => onNavigate(product.Item_Id), [onNavigate, product.Item_Id]);
  const haptic = useHaptic();
  const { animatedStyle: entranceStyle } = {
    animatedStyle: useEntrance(delay, false, Motion.list.initialY),
  };
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const firstImage = product.Images ? resolveImageUrl(product.Images) : null;
  const isOOS = isProductOOS(product);

  const discountPct = product.DiscountPct ?? 0;
  const hasDiscount = !isOOS && discountPct > 0;

  return (
    <Animated.View style={[centered ? styles.gridTileCentered : styles.gridTile, entranceStyle]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          onPress={() => {
            haptic.light();
            onPress();
          }}
          activeOpacity={1}
        >
          <View style={styles.gridImgWrap}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={[styles.gridImg, isOOS && styles.oosImage]}
                resizeMode="cover"
              />
            ) : null}
            {isOOS ? (
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText} numberOfLines={1}>Sold out</Text>
              </View>
            ) : hasDiscount ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText} numberOfLines={1}>−{discountPct}%</Text>
              </View>
            ) : null}
            <WishlistHeart inventoryId={product.Inventory_Id} />
          </View>
          <View style={styles.gridInfo}>
            {product.Brand_Name ? (
              <Text style={styles.gridBrand} numberOfLines={1}>
                {product.Brand_Name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.gridName} numberOfLines={2}>
              {product.Name}
            </Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.gridPrice}>Rs {product.Price.toLocaleString('en-IN')}</Text>
              {hasDiscount ? (
                <Text style={styles.heroCardWas}>Rs {product.ComparePrice.toLocaleString('en-IN')}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ── Featured span card — full-width editorial break ───────────────────────────
const SpanCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onNavigate: (itemId: number) => void;
  delay: number;
}> = React.memo(({ product, onNavigate, delay }) => {
  const onPress = useCallback(() => onNavigate(product.Item_Id), [onNavigate, product.Item_Id]);
  const haptic = useHaptic();
  const entranceStyle = useEntrance(delay, false, Motion.list.initialY);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const firstImage = product.Images ? resolveImageUrl(product.Images) : null;
  const isOOS = isProductOOS(product);

  const discountPct = product.DiscountPct ?? 0;
  const hasDiscount = !isOOS && discountPct > 0;

  return (
    <Animated.View style={[styles.spanCard, entranceStyle]}>
      <Animated.View style={[{ flex: 1 }, pressStyle]}>
        <TouchableOpacity
          {...handlers}
          onPress={() => {
            haptic.light();
            onPress();
          }}
          activeOpacity={1}
          style={{ flex: 1 }}
        >
          <View style={styles.spanImgWrap}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={[StyleSheet.absoluteFillObject, isOOS && styles.oosImage]}
                resizeMode="contain"
              />
            ) : null}
            {isOOS ? (
              <View style={styles.oosBadge}>
                <Text style={styles.oosBadgeText} numberOfLines={1}>Sold out</Text>
              </View>
            ) : hasDiscount ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText} numberOfLines={1}>−{discountPct}%</Text>
              </View>
            ) : null}
            <WishlistHeart inventoryId={product.Inventory_Id} />
          </View>
          <View style={styles.spanFooter}>
            {product.Brand_Name ? (
              <Text style={styles.gridBrand}>
                {product.Brand_Name.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.spanName} numberOfLines={2}>
              {product.Name}
            </Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.gridPrice}>Rs {product.Price.toLocaleString('en-IN')}</Text>
              {hasDiscount ? (
                <Text style={styles.heroCardWas}>Rs {product.ComparePrice.toLocaleString('en-IN')}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ── Skeleton — 3 rows of 2-column grid tiles ──────────────────────────────────
const SKELETON_ROWS = [
  [{ brand: '45%', name: '80%', price: '35%' }, { brand: '55%', name: '70%', price: '40%' }],
  [{ brand: '38%', name: '85%', price: '30%' }, { brand: '50%', name: '65%', price: '45%' }],
  [{ brand: '42%', name: '75%', price: '38%' }, { brand: '60%', name: '55%', price: '32%' }],
] as const;

const ResultSkeleton: React.FC = () => (
  <View style={styles.skeletonWrap}>
    {SKELETON_ROWS.map((pair, rowIdx) => (
      <View key={rowIdx} style={[styles.gridRow, rowIdx > 0 && { marginTop: 0 }]}>
        {pair.map((col, colIdx) => (
          <View key={colIdx} style={{ width: COL_W }}>
            <Skeleton
              height={GRID_IMG_H}
              width={COL_W}
              radius={16}
              style={{ marginBottom: Space[2] }}
            />
            <Skeleton height={9}  width={col.brand} style={{ marginBottom: Space[1] }} />
            <Skeleton height={12} width={col.name}  style={{ marginBottom: Space[1] }} />
            <Skeleton height={12} width={col.price} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

let _allProductsCallCount = 0; // TEMP — remove after measuring

// ── Main screen ───────────────────────────────────────────────────────────────
const ResultScreen: React.FC<ResultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const haptic = useHaptic();
  const { refresh: refreshWishlist } = useWishlist();
  const wishlistFetchTime = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const isWishlistStale = wishlistCache.lastFetchTime === 0
        || wishlistCache.lastFetchTime > wishlistFetchTime.current;
      if (isWishlistStale) {
        let cancelled = false;
        refreshWishlist().then(() => {
          if (!cancelled) wishlistFetchTime.current = Date.now();
        }).catch(() => {});
        return () => { cancelled = true; };
      }
    }, [refreshWishlist]),
  );

  const {
    categoryId,
    brandId,
    searchQuery: searchQueryParam,
    categoryName = 'Browse',
    flashDeals: isFlashDeals = false,
    itemIds,
    initialSort,
    initialDiscount,
  } = route.params as {
    categoryId?: string;
    brandId?: number;
    searchQuery?: string;
    categoryName?: string;
    flashDeals?: boolean;
    itemIds?: number[];
    initialSort?: SortKey;
    initialDiscount?: boolean;
  };

  // Curated ID list (e.g. Home's "Picked for you → See all") — a fixed set,
  // not an incrementally-fetchable feed, so pagination/infinite-scroll is
  // skipped and the result is just the fetched page filtered to these IDs.
  const itemIdSet = useMemo(
    () => (itemIds && itemIds.length > 0 ? new Set(itemIds) : null),
    [itemIds],
  );

  const { loading, isError, error, run } = useAsyncState<
    ProductByCategoryProductDetails[]
  >([]);
  const [allProducts, setAllProducts] = useState<
    ProductByCategoryProductDetails[]
  >([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  // setLoadingMore (React state) doesn't take effect until the next render —
  // a scroll event that fires again in that gap would still see the old
  // loadingMore value and call loadMore() a second time. This ref flips
  // synchronously, so a same-tick re-check correctly sees "already loading."
  const loadMoreInFlight = useRef(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  // ScrollView's ref never resolves on some devices in this build (confirmed
  // on HomeScreen: even a callback ref never fires on the ScrollView itself,
  // while it fires normally on a plain View) — scrollRef.current?.scrollTo()
  // is a guaranteed no-op there. Remounting via `key` instead: a fresh
  // ScrollView always starts at offset 0, sidestepping the ref entirely.
  const [scrollGen, setScrollGen] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity  = useRef(new Animated.Value(0)).current;
  const scrollToTop = useCallback(() => {
    setShowScrollTop(false);
    Animated.timing(scrollTopOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setScrollGen(g => g + 1);
  }, [scrollTopOpacity]);

  const headerAnim = useEntrance(40, false, 12);

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [filterCategories, setFilterCategories] = useState<number[]>([]);
  const [filterBrands, setFilterBrands] = useState<number[]>([]);
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterDiscount, setFilterDiscount] = useState(initialDiscount ?? false);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort ?? 'default');
  const [sheetCategories, setSheetCategories] =
    useState<CategoryInterface[]>(resultScreenCache.categories);
  const [sheetBrands, setSheetBrands] =
    useState<{ id: number; name: string }[]>(resultScreenCache.brands);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Draft state — lives in sheet until Apply is tapped
  const [draftCategories, setDraftCategories] = useState<number[]>([]);
  const [draftBrands, setDraftBrands] = useState<number[]>([]);
  const [draftPriceMin, setDraftPriceMin] = useState('');
  const [draftPriceMax, setDraftPriceMax] = useState('');
  const [draftDiscount, setDraftDiscount] = useState(initialDiscount ?? false);
  const [draftSortKey, setDraftSortKey] = useState<SortKey>(initialSort ?? 'default');

  const activeFilterCount =
    filterCategories.length +
    filterBrands.length +
    (filterPriceMin || filterPriceMax ? 1 : 0) +
    (filterDiscount ? 1 : 0);

  // ── Brands for filter sheet — direct from getBrands API ──────────────────
  const allBrandsFromSheet = sheetBrands;

  // ── Fetch categories + brands once per session — skip if already cached ──
  useEffect(() => {
    let active = true;
    if (!resultScreenCache.categories.length) {
      (async () => {
        const CATEGORY_PAGE_SIZE = 50;
        const first = await getCategories(1, CATEGORY_PAGE_SIZE);
        if (!active) return;
        if (first?.statusCode !== 1) return;
        const total: number = first.result?.TotalRecords ?? 0;
        let list: CategoryInterface[] = Array.isArray(first.result?.Categories) ? first.result.Categories : [];

        let page = 1;
        while (list.length < total && active) {
          page += 1;
          const res = await getCategories(page, CATEGORY_PAGE_SIZE);
          if (!active) return;
          const next: CategoryInterface[] = (res?.statusCode === 1 && Array.isArray(res.result?.Categories)) ? res.result.Categories : [];
          if (next.length === 0) break;
          list = list.concat(next);
        }

        resultScreenCache.categories = list;
        setSheetCategories(resultScreenCache.categories);
      })().catch(() => {});
    }
    if (!resultScreenCache.brands.length) {
      (async () => {
        const BRAND_PAGE_SIZE = 50;
        const first = await getBrands(1, BRAND_PAGE_SIZE);
        if (!active) return;
        if (first?.statusCode !== 1) return;
        const total: number = first.result?.TotalRecords ?? 0;
        let list: GetBrandItem[] = Array.isArray(first.result?.Brands) ? first.result.Brands : [];

        let page = 1;
        while (list.length < total && active) {
          page += 1;
          const res = await getBrands(page, BRAND_PAGE_SIZE);
          if (!active) return;
          const next: GetBrandItem[] = (res?.statusCode === 1 && Array.isArray(res.result?.Brands)) ? res.result.Brands : [];
          if (next.length === 0) break;
          list = list.concat(next);
        }

        resultScreenCache.brands = list.map((b: GetBrandItem) => ({
          id: Number(b.BrandId),
          name: b.BrandName,
        }));
        setSheetBrands(resultScreenCache.brands);
      })().catch(() => {});
    }
    return () => {
      active = false;
    };
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
  }, [
    filterCategories,
    filterBrands,
    filterPriceMin,
    filterPriceMax,
    filterDiscount,
    sortKey,
  ]);

  // ── Shared mapper: allProducts API response → ProductByCategoryProductDetails
  // Carries the full merchant-portal payload through as optional passthrough
  // fields (ComplianceInfo, ProductClassification, Marketing, PolicyInfo,
  // AdditionalInfo, ShippingInfo, RawVariants) instead of discarding them —
  // cards today still only read the flattened fields below, unchanged.
  // Pricing (Price/ComparePrice/DiscountPct) no longer comes flattened on the
  // product root — the backend only sends it per-variant under
  // Variants[].PriceDetails. Which purchasable variant represents the product
  // depends on the active sort: price_asc shows the cheapest purchasable
  // variant, price_desc the priciest, so the displayed price agrees with the
  // server's price-sorted order; any other sort (default/newest) shows the
  // first purchasable variant. Falls back to Variants[0] only when every
  // variant is truly sold out. Same variant backs Inventory_Id/Variant/Count
  // so the card's price and its "add to cart" target always agree.
  const mapProducts = (raw: AllProductsRawItem[]): ProductByCategoryProductDetails[] =>
    raw.map(p => {
      const purchasable = p.Variants?.filter(isVariantPurchasable) ?? [];
      let variant = purchasable[0] ?? p.Variants?.[0];
      if (purchasable.length > 1) {
        if (sortKey === 'price_asc') {
          variant = purchasable.reduce((min, v) =>
            v.PriceDetails.Price < min.PriceDetails.Price ? v : min,
          );
        } else if (sortKey === 'price_desc') {
          variant = purchasable.reduce((max, v) =>
            v.PriceDetails.Price > max.PriceDetails.Price ? v : max,
          );
        }
      }
      const priceDetails = variant?.PriceDetails;
      return {
        Item_Id: Number(p.ItemID),
        Name: p.Name,
        Price: priceDetails?.Price ?? 0,
        ComparePrice: priceDetails?.ComparePrice ?? 0,
        Description: p.Description,
        SubCategory_Id: Number(p.SubcategoryID),
        Images: p.Images,
        Date_Created: p.CreatedDate,
        Brand_Id: Number(p.BrandID),
        ApprovedBy: null,
        ApprovedOn: null,
        VendorID: 0,
        Brand_Name: p.BrandName,
        Category_Id: Number(p.CategoryID),
        CategoryName: p.CategoryName,
        CategoryImage: p.CategoryImage,
        SCName: p.SCName,
        DiscountPct:  priceDetails?.DiscountPct ?? 0,
        Inventory_Id: variant ? Number(variant.InventoryID) : 0,
        Variant: variant?.Variant ?? '',
        Count: variant?.Stock ?? 0,
        Date_Updated: p.CreatedDate,
        RelatedProducts:       p.RelatedProducts,
        ComplianceInfo:        p.ComplianceInfo,
        ProductClassification: p.ProductClassification,
        Marketing:             p.Marketing,
        PolicyInfo:            p.PolicyInfo,
        AdditionalInfo:        p.AdditionalInfo,
        ShippingInfo:          p.ShippingInfo,
        RawVariants:           p.Variants,
      };
    });

  // ── Build allProducts payload from current filter + route state ───────────
  const buildPayload = useCallback(
    (
      page: number,
      opts?: {
        cats?: number[];
        brands?: number[];
        priceMin?: string;
        priceMax?: string;
        discount?: boolean;
        query?: string;
        sort?: SortKey;
      },
    ) => {
      const cats = opts?.cats ?? filterCategories;
      const brands = opts?.brands ?? filterBrands;
      const priceMin = opts?.priceMin ?? filterPriceMin;
      const priceMax = opts?.priceMax ?? filterPriceMax;
      const discount = opts?.discount ?? filterDiscount;
      const serverSort = toServerSortBy(opts?.sort ?? sortKey);

      const effectiveBrands =
        brands.length > 0 ? brands : brandId != null ? [Number(brandId)] : [];
      const effectiveCategories =
        cats.length > 0 ? cats : categoryId != null ? [Number(categoryId)] : [];

      return {
        brands: effectiveBrands,
        categories: effectiveCategories,
        subCategories: [],
        searchQuery: opts?.query ?? searchQueryParam ?? '%',
        priceRange: {
          from: priceMin !== '' ? Number(priceMin) : null,
          to: priceMax !== '' ? Number(priceMax) : null,
        },
        discount: discount || isFlashDeals ? ON_SALE_DISCOUNT_RANGE : null,
        sortBy: serverSort,
        pagination: { pageNumber: page, pageSize: PAGE_SIZE },
      };
      // isFlashDeals intentionally included — buildPayload must re-close when route params change
    },
    [
      filterCategories,
      filterBrands,
      filterPriceMin,
      filterPriceMax,
      filterDiscount,
      sortKey,
      brandId,
      categoryId,
      searchQueryParam,
      isFlashDeals,
    ],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial / filter-reset fetch (page 1, replaces list) ─────────────────
  const fetchProducts = useCallback(
    (opts?: {
      cats?: number[];
      brands?: number[];
      priceMin?: string;
      priceMax?: string;
      discount?: boolean;
      query?: string;
      sort?: SortKey;
      cancelled?: { current: boolean };
    }) => {
      setPageNumber(1);
      setHasMore(true);
      setAllProducts([]);
      setTotalCount(null);
      return run(async () => {
        const payload = buildPayload(1, opts);
        console.log(`[allProducts] ResultScreen fetchProducts #${++_allProductsCallCount}`); // TEMP — remove after measuring
        const response = await axiosInstance.post(
          productEndpoints.allProducts,
          payload,
        );
        let page = deduplicateProducts(
          mapProducts(response.data?.result?.Products ?? []),
        );
        if (itemIdSet) {
          page = page.filter(p => itemIdSet.has(p.Item_Id));
          setHasMore(false);
          setTotalCount(page.length);
        } else {
          setTotalCount(response.data?.result?.TotalRecords ?? null);
          if (page.length < PAGE_SIZE) setHasMore(false);
        }
        setAllProducts(page);
        return page;
      }, opts?.cancelled);
    },
    [run, buildPayload, itemIdSet],
  );

  // ── Load next page — appends to list ─────────────────────────────────────
  const loadMore = useCallback(async () => {
    // loadMoreInFlight (a ref) is checked instead of relying solely on
    // loadingMore (React state) — state updates aren't visible until the
    // next render, so a second scroll-triggered call arriving before that
    // render could otherwise slip past the loadingMore check and fire a
    // duplicate/overlapping page fetch. The ref flips synchronously, closing
    // that gap.
    if (loadMoreInFlight.current || !hasMore || loading) return;
    loadMoreInFlight.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageNumber + 1;
      const payload = buildPayload(nextPage);
      console.log(`[allProducts] ResultScreen loadMore #${++_allProductsCallCount} (page ${nextPage})`); // TEMP — remove after measuring
      const response = await axiosInstance.post(
        productEndpoints.allProducts,
        payload,
      );
      const page = deduplicateProducts(
        mapProducts(response.data?.result?.Products ?? []),
      );
      setTotalCount(response.data?.result?.TotalRecords ?? null);
      if (page.length < PAGE_SIZE) setHasMore(false);
      if (page.length > 0) {
        setAllProducts(prev => deduplicateProducts([...prev, ...page]));
        setPageNumber(nextPage);
      }
    } catch {}
    loadMoreInFlight.current = false;
    setLoadingMore(false);
  }, [hasMore, loading, pageNumber, buildPayload]);

  // ── Scroll-near-bottom detection ──────────────────────────────────────────
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const y = contentOffset.y;

      // Infinite scroll
      const distanceFromBottom = contentSize.height - y - layoutMeasurement.height;
      if (distanceFromBottom < 400 && !loadingMore && hasMore && !loading) {
        loadMore();
      }

      // Scroll to top button
      const shouldShow = y > 300;
      setShowScrollTop(prev => {
        if (prev !== shouldShow) {
          Animated.timing(scrollTopOpacity, {
            toValue:         shouldShow ? 1 : 0,
            duration:        200,
            useNativeDriver: true,
          }).start();
        }
        return shouldShow;
      });
    },
    [loadMore, loadingMore, hasMore, loading, scrollTopOpacity],
  );

  useEffect(() => {
    const cancelled = { current: false };
    fetchProducts({ cancelled });
    return () => {
      cancelled.current = true;
    };
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
      cats: draftCategories,
      brands: draftBrands,
      priceMin: draftPriceMin,
      priceMax: draftPriceMax,
      discount: draftDiscount,
      sort: draftSortKey,
    });
  }, [
    draftCategories,
    draftBrands,
    draftPriceMin,
    draftPriceMax,
    draftDiscount,
    draftSortKey,
    fetchProducts,
  ]);

  // ── Clear all draft state ──────────────────────────────────────────────────
  const handleClearAll = useCallback(() => {
    setDraftCategories([]);
    setDraftBrands([]);
    setDraftPriceMin('');
    setDraftPriceMax('');
    setDraftDiscount(false);
    setDraftSortKey('default');
  }, []);

  // ── Clear all committed filters and refetch ────────────────────────────────
  const clearFilters = useCallback(() => {
    haptic.light();
    setFilterCategories([]);
    setFilterBrands([]);
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterDiscount(false);
    setSortKey('default');
    setDraftCategories([]);
    setDraftBrands([]);
    setDraftPriceMin('');
    setDraftPriceMax('');
    setDraftDiscount(false);
    setDraftSortKey('default');
    fetchProducts({
      cats: [], brands: [], priceMin: '', priceMax: '',
      discount: false, sort: 'default',
    });
  }, [haptic, fetchProducts]);

  const toggleDraftCategory = useCallback(
    (id: number) => {
      haptic.light();
      setDraftCategories(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
      );
    },
    [haptic],
  );

  const toggleDraftBrand = useCallback(
    (id: number) => {
      haptic.light();
      setDraftBrands(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
      );
    },
    [haptic],
  );

  // ── Price bounds derived from all loaded products ─────────────────────────
  // Price bounds persist across fetches — never reset to 0/10000 mid-session
  const priceBoundsRef = useRef<{ floor: number; ceiling: number } | null>(null);
  useEffect(() => {
    if (allProducts.length === 0) return;
    const lo = Math.floor(allProducts.reduce((m, p) => Math.min(m, p.Price), Infinity));
    const hi = Math.ceil(allProducts.reduce((m, p) => Math.max(m, p.Price), -Infinity));
    priceBoundsRef.current = {
      floor:   priceBoundsRef.current ? Math.min(priceBoundsRef.current.floor, lo) : lo,
      ceiling: priceBoundsRef.current ? Math.max(priceBoundsRef.current.ceiling, hi) : hi,
    };
  }, [allProducts]);
  const priceFloor   = priceBoundsRef.current?.floor   ?? 0;
  const priceCeiling = priceBoundsRef.current?.ceiling ?? 10000;

  // ── Rendered product list — sort is fully server-driven (see buildPayload/
  // toServerSortBy); allProducts is already in the right order, page over page.
  const deduplicated = allProducts;
  const rows = useMemo(() => {
    const gridProducts = deduplicated;
    const result: Array<
      | {
          type: 'pair';
          left: ProductByCategoryProductDetails;
          right?: ProductByCategoryProductDetails;
          leftIdx: number;
          rightIdx?: number;
        }
      | { type: 'span'; product: ProductByCategoryProductDetails; idx: number }
    > = [];
    let i = 0;
    let pairIdx = 0;
    while (i < gridProducts.length) {
      if (pairIdx > 0 && pairIdx % 2 === 0 && isFeaturedSpan(i)) {
        result.push({ type: 'span', product: gridProducts[i], idx: i });
        i++;
        pairIdx = 0;
        continue;
      }
      const left = gridProducts[i];
      const right = gridProducts[i + 1];
      result.push({
        type: 'pair',
        left,
        right,
        leftIdx: i,
        rightIdx: right ? i + 1 : undefined,
      });
      i += right ? 2 : 1;
      pairIdx++;
    }
    return result;
  }, [deduplicated]);

  const navigateToProduct = useCallback(
    (itemId: number) => navigation.navigate('Product', { product: itemId }),
    [navigation],
  );

  const filterButton = (
    <TouchableOpacity
      onPress={() => {
        haptic.light();
        openSheet();
      }}
      activeOpacity={0.75}
      style={styles.filterPill}
    >
      <Icon
        name="options-outline"
        size={13}
        color={activeFilterCount > 0 ? Colors.brandNavy : Colors.ink3}
      />
      <Text
        style={[
          styles.filterPillText,
          activeFilterCount > 0 && styles.filterPillTextActive,
        ]}
      >
        Filter
      </Text>
      {activeFilterCount > 0 && <View style={styles.filterDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Light inline header ───────────────────────────────────────── */}
      <Animated.View style={[styles.headerWrap, { paddingTop: insets.top }, headerAnim]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="chevron-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
            {!loading && deduplicated.length > 0 && (
              <Text style={styles.headerCount}>
                {totalCount ?? deduplicated.length} {(totalCount ?? deduplicated.length) === 1 ? 'product' : 'products'}
              </Text>
            )}
          </View>

          {filterButton}
        </View>
        <View style={styles.headerDivider} />
      </Animated.View>

      {loading ? (
        <View style={[styles.scroll, styles.scrollContent]}>
          <ResultSkeleton />
        </View>
      ) : isError ? (
        <View style={[styles.scroll, styles.scrollContent, styles.stateWrap]}>
          <ErrorState
            title="Products didn't load."
            message={error ?? 'Check your connection and try again.'}
            onRetry={() => fetchProducts()}
            retryLoading={loading}
          />
          <View style={styles.stateSecondaryAction}>
            <TextLinkButton
              label="Go back"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      ) : deduplicated.length === 0 && activeFilterCount > 0 ? (
        <View style={[styles.scroll, styles.scrollContent, styles.stateWrap]}>
          <EmptyState
            icon={<Icon name="options-outline" size={22} color={Colors.ink4} />}
            title="No matches found."
            body="Remove a filter to see more products."
            action={
              <TouchableOpacity
                style={styles.emptyPrimaryBtn}
                onPress={clearFilters}
                activeOpacity={0.88}
                accessibilityRole="button"
              >
                <Text style={styles.emptyPrimaryBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            }
          />
        </View>
      ) : deduplicated.length === 0 ? (
        <View style={[styles.scroll, styles.scrollContent, styles.stateWrap]}>
          <EmptyState
            icon={<Icon name="grid-outline" size={22} color={Colors.ink4} />}
            title="Nothing here yet."
            body="This collection is still being built. Explore other categories."
            action={
              <TouchableOpacity
                style={styles.emptyPrimaryBtn}
                onPress={() => navigation.navigate('Result', {
                  categoryName: 'All Products',
                  searchQuery: '%',
                })}
                activeOpacity={0.88}
                accessibilityRole="button"
              >
                <Text style={styles.emptyPrimaryBtnText}>Browse All Products</Text>
              </TouchableOpacity>
            }
          />
        </View>
      ) : deduplicated.length <= 3 ? (
        <FlatList
          key={scrollGen}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Space[10] },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={deduplicated}
          keyExtractor={(product) => String(product.Item_Id)}
          renderItem={({ item: product, index: idx }) => (
            <FeaturedCard
              product={product}
              onNavigate={navigateToProduct}
              delay={Motion.stagger.delay(idx)}
            />
          )}
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator size="small" color={Colors.ink3} style={{ marginVertical: Space[6] }} />
          ) : null}
        />
      ) : (
        <FlatList
          key={scrollGen}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Space[10] },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          data={rows}
          keyExtractor={(row) => row.type === 'span' ? `span-${row.idx}` : `pair-${row.leftIdx}`}
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
          renderItem={({ item: row, index: rowIndex }) => {
            if (row.type === 'span') {
              return (
                <SpanCard
                  product={row.product}
                  onNavigate={navigateToProduct}
                  delay={Motion.stagger.delay(rowIndex)}
                />
              );
            }

            const leftDelay  = Motion.stagger.delay(rowIndex * 2);
            const rightDelay = Motion.stagger.delay(rowIndex * 2 + 1);

            const isOrphan = !row.right;
            return (
              <View style={[styles.gridRow, isOrphan && styles.gridRowCentered]}>
                <GridTile
                  product={row.left}
                  onNavigate={navigateToProduct}
                  delay={leftDelay}
                  centered={isOrphan}
                />
                {row.right && (
                  <GridTile
                    product={row.right}
                    onNavigate={navigateToProduct}
                    delay={rightDelay}
                  />
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <>
              {loadingMore && (
                <ActivityIndicator
                  size="small"
                  color={Colors.ink3}
                  style={{ marginVertical: Space[6] }}
                />
              )}
              {!hasMore && allProducts.length > 3 && !loading && (
                <View style={styles.endOfResultsRow}>
                  <View style={styles.endOfResultsLine} />
                  <Text style={styles.endOfResults}>End of results</Text>
                  <View style={styles.endOfResultsLine} />
                </View>
              )}
            </>
          }
        />
      )}

      <Animated.View
        style={[styles.scrollTopBtn, { opacity: scrollTopOpacity }]}
        pointerEvents={showScrollTop ? 'box-none' : 'none'}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          activeOpacity={0.85}
          style={styles.scrollTopInner}
        >
          <Icon name="arrow-up" size={18} color={Colors.ink1} />
        </TouchableOpacity>
      </Animated.View>

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
        priceFloor={priceFloor}
        priceCeiling={priceCeiling}
      />
    </View>
  );
};

export default ResultScreen;
