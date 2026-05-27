import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useProfileCode } from '../hooks/useProfileCode';
import { getWishlist, removeFromWishlist } from '../api/wishlist';
import { selectProduct } from '../api/product';
import type { WishlistItemInterface } from '../api/interfaces';
import { EmptyState, BottomNavBar, Price, DarkHeader } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { Motion } from '../theme/motion';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type WishlistScreenProps = {
  navigation: NavigationProp;
};

type ProductDetail = { imageUri: string; itemId: number };

const IMG_W = 80;
const IMG_H = 100;

// ── Single wishlist row ───────────────────────────────────────────────────────
const WishlistRow: React.FC<{
  item: WishlistItemInterface;
  detail: ProductDetail | null;
  onRemove: (code: number) => void;
  onPress: (itemId: number) => void;
  delay: number;
  isLast: boolean;
}> = ({ item, detail, onRemove, onPress, delay, isLast }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const hasDiscount = item.ComparePrice > item.Price;
  const isOutOfStock = item.IsInStock === 0;

  const onImageLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: Motion.duration.settle, useNativeDriver: true }).start();
  }, [imgOpacity]);

  return (
    <Animated.View style={entrance}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          style={styles.row}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(detail?.itemId ?? item.InventoryID); }}
        >
          {/* Product image — fade in when loaded, brand initial fallback */}
          <View style={styles.imgWrap}>
            {detail?.imageUri ? (
              <Animated.Image
                source={{ uri: detail.imageUri }}
                style={[styles.img, { opacity: imgOpacity }]}
                resizeMode="cover"
                onLoad={onImageLoad}
              />
            ) : (
              <Text style={styles.imgPlaceholderLetter}>
                {(item.BrandName ?? item.Name).charAt(0).toUpperCase()}
              </Text>
            )}
            {isOutOfStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Sold out</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {item.BrandName ? (
              <Text style={styles.brand}>{item.BrandName.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
            {item.SKU ? (
              <Text style={styles.variant}>{item.SKU}</Text>
            ) : null}
            <View style={styles.priceRow}>
              <Price
                value={item.Price}
                was={hasDiscount ? item.ComparePrice : undefined}
                size="base"
              />
            </View>
          </View>

          {/* Remove */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => { haptic.light(); onRemove(item.WishlistCode); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.removeGlyph}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>

      {!isLast && <View style={styles.divider} />}
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { data: fetched, loading, isError, error, run } = useAsyncState<WishlistItemInterface[]>([]);
  const [items, setItems]                               = useState<WishlistItemInterface[]>([]);
  const [detailMap, setDetailMap]                       = useState<Record<number, ProductDetail>>({});
  const hasFetched = useRef(false);
  const profileCode = useProfileCode();

  useEffect(() => {
    if (!fetched) return;
    if (fetched.length > 0) setItems(fetched);
    Promise.all(
      fetched.map(item =>
        selectProduct(String(item.InventoryID))
          .then(res => {
            const product = Array.isArray(res?.result) ? res.result[0] : null;
            if (!product) return null;
            const imageUri = product.Images?.split(';')[0]?.trim() ?? '';
            return { inventoryId: item.InventoryID, imageUri, itemId: Number(product.Item_Id) };
          })
          .catch(() => null),
      ),
    ).then(results => {
      const map: Record<number, ProductDetail> = {};
      results.forEach(r => { if (r) map[r.inventoryId] = { imageUri: r.imageUri, itemId: r.itemId }; });
      setDetailMap(map);
    });
  }, [fetched]);

  const fetchWishlist = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        if (!profileCode) return [];
        const response = await getWishlist(profileCode);
        const result = response.statusCode === 1 ? (response.result || []) : [];
        hasFetched.current = true;
        return result;
      }, cancelled),
    [run, profileCode],
  );

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      hasFetched.current = false;
      setItems([]);
      fetchWishlist(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchWishlist]),
  );

  const handleRemove = async (wishlistItemCode: number) => {
    if (!profileCode) return;
    setItems(prev => prev.filter(i => i.WishlistCode !== wishlistItemCode));
    await removeFromWishlist(profileCode, wishlistItemCode);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<WishlistItemInterface>) => (
    <WishlistRow
      item={item}
      detail={detailMap[item.InventoryID] ?? null}
      onRemove={handleRemove}
      onPress={(itemId) => navigation.navigate('Product', { product: String(itemId) })}
      delay={Math.min(index * 55, 320)}
      isLast={index === items.length - 1}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon={<Icon name="heart-outline" size={26} color={Colors.ink4} />}
      title="Nothing saved yet."
      body="Save items as you browse — they'll appear here."
      action={
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.emptyLink}>Browse the collection</Text>
          <View style={styles.emptyLinkUnderline} />
        </TouchableOpacity>
      }
    />
  );

  const itemCount = items.length;

  const renderBody = () => {
    if (isError) {
      return (
        <View style={styles.stateWrap}>
          <ErrorState
            title="Couldn't load your wishlist."
            message={error ?? 'Tap retry to try again.'}
            onRetry={() => fetchWishlist()}
            retryLoading={loading}
          />
        </View>
      );
    }

    if (!hasFetched.current && !isError) {
      return (
        <View style={[styles.stateWrap, { paddingHorizontal: Space.screenH, paddingTop: Space[4] }]}>
          {[0, 1, 2, 3].map(i => (
            <View key={i}>
              <View style={styles.skeletonRow}>
                <View style={styles.skeletonImg} />
                <View style={styles.skeletonContent}>
                  <View style={[styles.skeletonLine, { width: '35%' }]} />
                  <View style={[styles.skeletonLine, { width: '65%', marginTop: Space[2] }]} />
                  <View style={[styles.skeletonLine, { width: '45%', marginTop: Space[1] }]} />
                  <View style={[styles.skeletonLine, { width: '25%', marginTop: Space[4] }]} />
                </View>
              </View>
              {i < 3 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => String(item.WishlistCode)}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={hasFetched.current && !loading ? renderEmpty : null}
        style={styles.list}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      <DarkHeader
        eyebrow="SAVED ITEMS"
        title={itemCount === 0 ? 'Wishlist' : `${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'}`}
        onBack={() => navigation.goBack()}
        paddingTop={insets.top + Space[2]}
      />

      {renderBody()}

      <BottomNavBar
        activeTab="Wishlist"
        onNavigate={(route) => navigation.navigate(route)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },

  // ── List ──────────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[8],
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
  },

  // ── Row — no card boxing, hairline dividers only ──────────────────────────────
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: Space[4],
    gap:             Space[4],
  },
  divider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── Content ───────────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    gap:  4,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    15 * 1.35,
  },
  variant: {
    ...Type.caption,
    color: Colors.ink4,
  },
  priceRow: {
    marginTop: 2,
  },

  // ── Image ─────────────────────────────────────────────────────────────────────
  imgWrap: {
    width:           IMG_W,
    height:          IMG_H,
    borderRadius:    8,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
    overflow:        'hidden',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  imgPlaceholderLetter: {
    fontFamily:    FontFamily.serifItalic,
    fontSize:      32,
    color:         Colors.ink3,
    lineHeight:    36,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,247,244,0.72)',
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingBottom:   Space[2],
  },
  outOfStockText: {
    ...Type.label,
    color:         Colors.ink3,
    letterSpacing: 0.4,
  },

  // ── Remove — plain × glyph (CartScreen frozen pattern) ───────────────────────
  removeBtn: {
    flexShrink: 0,
    paddingLeft: Space[2],
  },
  removeGlyph: {
    fontSize:   18,
    fontWeight: '300',
    color:      Colors.ink4,
    lineHeight: 20,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  skeletonRow: {
    flexDirection:   'row',
    gap:             Space[4],
    paddingVertical: Space[4],
  },
  skeletonImg: {
    width:           IMG_W,
    height:          IMG_H,
    borderRadius:    Radius.md,
    backgroundColor: Colors.surfaceDeep,
    flexShrink:      0,
  },
  skeletonContent: {
    flex:       1,
    paddingTop: Space[1],
  },
  skeletonLine: {
    height:          10,
    borderRadius:    Radius.xs,
    backgroundColor: Colors.surfaceDeep,
  },

  // ── Empty state CTA — text link, no Button component ─────────────────────────
  emptyLink: {
    ...Type.caption,
    color:     Colors.ink3,
    textAlign: 'center',
  },
  emptyLinkUnderline: {
    height:          1,
    backgroundColor: Colors.ink4,
    marginTop:       3,
    width:           '100%',
  },
});

export default WishlistScreen;
