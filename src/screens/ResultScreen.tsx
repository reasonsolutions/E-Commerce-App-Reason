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
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { getCategories, getBrands } from '../api/product';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { SortBy } from '../config/enum_files/SortBy';
import axiosInstance from '../api/axiosInstance';
import { productEndpoints } from '../api/endpoints';
import {
  ProductByCategoryProductDetails,
  CategoryInterface,
  GetBrandItem,
} from '../api/interfaces';
import {
  Skeleton,
  EmptyState,
  FilterSheet,
} from '../components/ui';
import type { SortKey } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import {
  styles,
  COL_W,
  GRID_IMG_H,
  HERO_IMG_H,
} from './ResultScreen.styles';
import { addToWishlist } from '../api/wishlist';
import { useProfileCode } from '../hooks/useProfileCode';

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

function toServerSortBy(sortKey: SortKey): SortBy | null {
  if (sortKey === 'price_asc')  return SortBy.LowToHigh;
  if (sortKey === 'price_desc') return SortBy.HighToLow;
  return null;
}

function applySort(
  products: ProductByCategoryProductDetails[],
  sortKey: SortKey,
): ProductByCategoryProductDetails[] {
  if (sortKey === 'newest') {
    return [...products].sort((a, b) =>
      new Date(b.Date_Created).getTime() - new Date(a.Date_Created).getTime(),
    );
  }
  return products;
}

// ── Wishlist heart — bare icon, no background circle ─────────────────────────
const WishlistHeart: React.FC<{ inventoryId: number }> = ({ inventoryId }) => {
  const haptic      = useHaptic();
  const profileCode = useProfileCode();
  const [added, setAdded] = useState(false);

  const onPress = useCallback(async () => {
    if (!profileCode || added) return;
    haptic.light();
    setAdded(true);
    try {
      await addToWishlist(profileCode, inventoryId);
    } catch {
      setAdded(false);
    }
  }, [profileCode, inventoryId, haptic, added]);

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={styles.heartBtn}
      activeOpacity={0.7}
    >
      <Icon
        name={added ? 'heart' : 'heart-outline'}
        size={18}
        color={added ? Colors.accent : Colors.ink4}
      />
    </TouchableOpacity>
  );
};

// ── Hero card — full-width image, identity below on clean surface ─────────────
const HeroCard: React.FC<{
  product: ProductByCategoryProductDetails;
  onNavigate: (itemId: number) => void;
}> = React.memo(({ product, onNavigate }) => {
  const onPress = useCallback(() => onNavigate(product.Item_Id), [onNavigate, product.Item_Id]);
  const haptic = useHaptic();
  const { animatedStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const firstImage = product.Images ? resolveImageUrl(product.Images.split(';').filter(Boolean)[0]) : null;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue: 1,
      duration: Motion.duration.carry,
      easing: Motion.easing.inOut,
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
          {firstImage ? (
            <Animated.Image
              source={{ uri: firstImage }}
              style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
          ) : null}
          <WishlistHeart inventoryId={product.Inventory_Id} />
        </View>
        <View style={styles.heroInfo}>
          {product.Brand_Name ? (
            <Text style={styles.heroCardBrand}>{product.Brand_Name.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.heroCardName} numberOfLines={2}>{product.Name}</Text>
          <View style={styles.heroPriceRow}>
            <Text style={styles.heroCardPrice}>Rs {product.Price.toFixed(0)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.heroCardWas}>Rs {product.ComparePrice.toFixed(0)}</Text>
                <Text style={styles.heroDiscount}>−{discountPct}%</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ── Standard 2-column grid tile ───────────────────────────────────────────────
const GridTile: React.FC<{
  product: ProductByCategoryProductDetails;
  onNavigate: (itemId: number) => void;
  delay: number;
}> = React.memo(({ product, onNavigate, delay }) => {
  const onPress = useCallback(() => onNavigate(product.Item_Id), [onNavigate, product.Item_Id]);
  const haptic = useHaptic();
  const { animatedStyle: entranceStyle } = {
    animatedStyle: useEntrance(delay, false, 12),
  };
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const firstImage = product.Images ? resolveImageUrl(product.Images.split(';').filter(Boolean)[0]) : null;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue: 1,
      duration: Motion.duration.settle,
      easing: Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.ComparePrice - product.Price) / product.ComparePrice) * 100,
      )
    : 0;

  return (
    <Animated.View style={[styles.gridTile, entranceStyle]}>
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
              <Animated.Image
                source={{ uri: firstImage }}
                style={[styles.gridImg, { opacity: imgOpacity }]}
                resizeMode="cover"
                onLoad={onLoad}
              />
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
              <Text style={styles.gridPrice}>Rs {product.Price.toFixed(0)}</Text>
              {hasDiscount && (
                <Text style={styles.heroDiscount}>−{discountPct}%</Text>
              )}
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
  const entranceStyle = useEntrance(delay, false, 12);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const firstImage = product.Images ? resolveImageUrl(product.Images.split(';').filter(Boolean)[0]) : null;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue: 1,
      duration: Motion.duration.carry,
      easing: Motion.easing.inOut,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.ComparePrice - product.Price) / product.ComparePrice) * 100,
      )
    : 0;

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
              <Animated.Image
                source={{ uri: firstImage }}
                style={[StyleSheet.absoluteFillObject, { opacity: imgOpacity }]}
                resizeMode="cover"
                onLoad={onLoad}
              />
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
              <Text style={styles.gridPrice}>Rs {product.Price.toFixed(0)}</Text>
              {hasDiscount && (
                <Text style={styles.heroDiscount}>−{discountPct}%</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ── Skeleton — matches loaded layout shape ────────────────────────────────────
const ResultSkeleton: React.FC = () => (
  <View style={styles.skeletonWrap}>
    <Skeleton
      height={HERO_IMG_H}
      radius={Radius.md}
      style={{ marginBottom: Space[6] }}
    />
    <View style={styles.gridRow}>
      <View style={{ width: COL_W }}>
        <Skeleton
          height={GRID_IMG_H}
          width={COL_W}
          radius={Radius.md}
          style={{ marginBottom: Space[2] }}
        />
        <Skeleton height={9} width="45%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="80%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={12} width="35%" />
      </View>
      <View style={{ width: COL_W }}>
        <Skeleton
          height={GRID_IMG_H}
          width={COL_W}
          radius={Radius.md}
          style={{ marginBottom: Space[2] }}
        />
        <Skeleton height={9} width="55%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="70%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
    <View style={[styles.gridRow, { marginTop: Space[5] }]}>
      <View style={{ width: COL_W }}>
        <Skeleton
          height={GRID_IMG_H}
          width={COL_W}
          radius={Radius.md}
          style={{ marginBottom: Space[2] }}
        />
        <Skeleton height={9} width="38%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="85%" />
      </View>
      <View style={{ width: COL_W }}>
        <Skeleton
          height={GRID_IMG_H}
          width={COL_W}
          radius={Radius.md}
          style={{ marginBottom: Space[2] }}
        />
        <Skeleton height={9} width="50%" style={{ marginBottom: Space[1] }} />
        <Skeleton height={13} width="65%" />
      </View>
    </View>
  </View>
);

// ── Module-level cache — fetched once per app session ────────────────────────
let _cachedCategories: CategoryInterface[] = [];
let _cachedBrands: { id: number; name: string }[] = [];

// ── Main screen ───────────────────────────────────────────────────────────────
const ResultScreen: React.FC<ResultScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const haptic = useHaptic();
  const {
    categoryId,
    brandId,
    searchQuery: searchQueryParam,
    categoryName = 'Browse',
    flashDeals: isFlashDeals = false,
  } = route.params as {
    categoryId?: string;
    brandId?: number;
    searchQuery?: string;
    categoryName?: string;
    flashDeals?: boolean;
  };

  const { loading, isError, error, run } = useAsyncState<
    ProductByCategoryProductDetails[]
  >([]);
  const [allProducts, setAllProducts] = useState<
    ProductByCategoryProductDetails[]
  >([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const scrollRef         = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollTopOpacity  = useRef(new Animated.Value(0)).current;
  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const headerAnim = useEntrance(40, false, 12);
  const heroAnim = useEntrance(160, false, 12);

  // ── Filter / sort state ────────────────────────────────────────────────────
  const [filterCategories, setFilterCategories] = useState<number[]>([]);
  const [filterBrands, setFilterBrands] = useState<number[]>([]);
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterDiscount, setFilterDiscount] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sheetCategories, setSheetCategories] =
    useState<CategoryInterface[]>(_cachedCategories);
  const [sheetBrands, setSheetBrands] =
    useState<{ id: number; name: string }[]>(_cachedBrands);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Draft state — lives in sheet until Apply is tapped
  const [draftCategories, setDraftCategories] = useState<number[]>([]);
  const [draftBrands, setDraftBrands] = useState<number[]>([]);
  const [draftPriceMin, setDraftPriceMin] = useState('');
  const [draftPriceMax, setDraftPriceMax] = useState('');
  const [draftDiscount, setDraftDiscount] = useState(false);
  const [draftSortKey, setDraftSortKey] = useState<SortKey>('default');

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
    if (!_cachedCategories.length) {
      getCategories()
        .then(res => {
          if (!active) return;
          if (res?.statusCode === 1 && Array.isArray(res.result)) {
            _cachedCategories = res.result as CategoryInterface[];
            setSheetCategories(_cachedCategories);
          }
        })
        .catch(() => {});
    }
    if (!_cachedBrands.length) {
      getBrands()
        .then(res => {
          if (!active) return;
          const list = res?.result ?? [];
          _cachedBrands = list.map((b: GetBrandItem) => ({
            id: Number(b.BrandId),
            name: b.BrandName,
          }));
          setSheetBrands(_cachedBrands);
        })
        .catch(() => {});
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
  interface RawProduct {
    ItemID:       string;
    Name:         string;
    MinPrice:     number;
    MaxComparePrice: number;
    Description:  string;
    SubcategoryID:string;
    Images:       string;
    CreatedDate:  string;
    BrandID:      string;
    BrandName:    string;
    CategoryID:   string;
    CategoryName: string;
    CategoryImage:string;
    SCName:       string;
    DiscountPct?: number;
    Variants?:    { InventoryID: string; Variant: string; Stock: number }[];
  }

  const mapProducts = (raw: RawProduct[]): ProductByCategoryProductDetails[] =>
    raw.map(p => ({
      Item_Id: Number(p.ItemID),
      Name: p.Name,
      Price: p.MinPrice,
      ComparePrice: p.MaxComparePrice,
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
      DiscountPct:  p.DiscountPct ?? 0,
      Inventory_Id: p.Variants?.[0] ? Number(p.Variants[0].InventoryID) : 0,
      Variant: p.Variants?.[0]?.Variant ?? '',
      Count: p.Variants?.[0]?.Stock ?? 0,
      Date_Updated: p.CreatedDate,
    }));

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
        discount: discount || isFlashDeals ? 1 : null,
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
      return run(async () => {
        const payload = buildPayload(1, opts);
        const response = await axiosInstance.post(
          productEndpoints.allProducts,
          payload,
        );
        const page = deduplicateProducts(
          mapProducts(response.data?.result?.Products ?? []),
        );
        if (page.length < PAGE_SIZE) setHasMore(false);
        setAllProducts(page);
        return page;
      }, opts?.cancelled);
    },
    [run, buildPayload],
  );

  // ── Load next page — appends to list ─────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const nextPage = pageNumber + 1;
      const payload = buildPayload(nextPage);
      const response = await axiosInstance.post(
        productEndpoints.allProducts,
        payload,
      );
      const page = deduplicateProducts(
        mapProducts(response.data?.result?.Products ?? []),
      );
      if (page.length < PAGE_SIZE) setHasMore(false);
      if (page.length > 0) {
        setAllProducts(prev => deduplicateProducts([...prev, ...page]));
        setPageNumber(nextPage);
      }
    } catch {}
    setLoadingMore(false);
  }, [loadingMore, hasMore, loading, pageNumber, buildPayload]);

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

  // ── Rendered product list (sort applied client-side, driven by allProducts) ─
  const deduplicated = useMemo(
    () => applySort(allProducts, sortKey),
    [allProducts, sortKey],
  );
  const heroProduct = deduplicated[0] ?? null;

  const rows = useMemo(() => {
    const gridProducts = deduplicated.slice(1);
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
        color={activeFilterCount > 0 ? Colors.accent : Colors.ink3}
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
            <Icon name="arrow-back" size={22} color={Colors.ink1} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
          </View>

          {filterButton}
        </View>
        <View style={styles.headerDivider} />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Space[10] },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {loading ? (
          <ResultSkeleton />
        ) : isError ? (
          <View style={styles.stateWrap}>
            <ErrorState
              title="Couldn't load products."
              message={error ?? 'Tap retry to try again.'}
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
                  onNavigate={navigateToProduct}
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
                    onNavigate={navigateToProduct}
                    delay={delay}
                  />
                );
              }

              const leftDelay = Math.min(180 + rowIndex * 35, 400);
              const rightDelay = Math.min(180 + rowIndex * 35 + 55, 440);

              return (
                <View key={`pair-${row.leftIdx}`} style={styles.gridRow}>
                  <GridTile
                    product={row.left}
                    onNavigate={navigateToProduct}
                    delay={leftDelay}
                  />
                  {row.right ? (
                    <GridTile
                      product={row.right}
                      onNavigate={navigateToProduct}
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

        {loadingMore && (
          <ActivityIndicator
            size="small"
            color={Colors.ink3}
            style={{ marginVertical: Space[6] }}
          />
        )}

        {!hasMore && allProducts.length > 0 && !loading && (
          <View style={styles.endOfResultsRow}>
            <View style={styles.endOfResultsLine} />
            <Text style={styles.endOfResults}>End of results</Text>
            <View style={styles.endOfResultsLine} />
          </View>
        )}
      </ScrollView>

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
