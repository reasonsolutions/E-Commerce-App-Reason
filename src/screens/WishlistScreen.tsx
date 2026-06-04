import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Animated,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useProfileCode } from '../hooks/useProfileCode';
import { getWishlist, removeFromWishlist } from '../api/wishlist';
import { postSaveCartItems } from '../api/cart';
import type { WishlistItemInterface } from '../api/interfaces';
import { BottomNavBar, Price } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useCart } from '../context/CartContext';
import { toastEmitter } from '../utils/toastEmitter';

// ── Grid dimensions — mirrors ResultScreen.styles.ts ─────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP  = Space[3];
const COL_W    = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
const IMG_H    = COL_W * 1.25; // 4:5 portrait

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack:   () => void;
};

type WishlistScreenProps = {
  navigation: NavigationProp;
};

// ── Grid card ─────────────────────────────────────────────────────────────────
const WishlistCard: React.FC<{
  item:         WishlistItemInterface;
  onRemove:     (code: number) => void;
  onAddToBag:   (item: WishlistItemInterface) => void;
  addingToBag:  boolean;
  onPress:      (itemId: number) => void;
  delay:        number;
}> = ({ item, onRemove, onAddToBag, addingToBag, onPress, delay }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const price        = item.PriceDetails?.Price ?? 0;
  const comparePrice = item.PriceDetails?.ComparePrice ?? 0;
  const hasDiscount  = comparePrice > price;
  const isOOS        = item.IsInStock === 0;
  const imageUri     = Array.isArray(item.Images) ? item.Images[0] : '';

  const onImageLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue:         1,
      duration:        Motion.duration.settle,
      easing:          Motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  return (
    <Animated.View style={[styles.cardWrap, entrance]}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(item.ItemID); }}
          style={styles.card}
        >
          {/* ── Image ───────────────────────────────────────────────────── */}
          <View style={styles.imgWrap}>
            {imageUri ? (
              <Animated.Image
                source={{ uri: imageUri }}
                style={[styles.img, { opacity: imgOpacity }]}
                resizeMode="cover"
                onLoad={onImageLoad}
              />
            ) : (
              <View style={styles.imgPlaceholder}>
                <Text style={styles.imgPlaceholderLetter}>
                  {(item.BrandName ?? item.Name ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* OOS overlay */}
            {isOOS ? (
              <View style={styles.oosOverlay}>
                <View style={styles.oosBadge}>
                  <Text style={styles.oosBadgeText}>SOLD OUT</Text>
                </View>
              </View>
            ) : null}

            {/* Discount badge */}
            {hasDiscount && !isOOS ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>
                  {Math.round(((comparePrice - price) / comparePrice) * 100)}%
                </Text>
              </View>
            ) : null}

            {/* Remove — bare × top-right */}
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => { haptic.light(); onRemove(item.WishlistCode); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
            >
              <Text style={styles.removeGlyph}>×</Text>
            </TouchableOpacity>
          </View>

          {/* ── Info ────────────────────────────────────────────────────── */}
          <View style={styles.info}>
            {item.BrandName ? (
              <Text style={styles.brand} numberOfLines={1}>
                {item.BrandName.toUpperCase()}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
            <Price
              value={price}
              was={hasDiscount ? comparePrice : undefined}
              size="sm"
            />
          </View>

          {/* ── Add to Bag ──────────────────────────────────────────────── */}
          {!isOOS ? (
            <TouchableOpacity
              style={[styles.bagBtn, addingToBag && styles.bagBtnLoading]}
              onPress={() => { haptic.light(); onAddToBag(item); }}
              activeOpacity={0.85}
              disabled={addingToBag}
            >
              <Text style={styles.bagBtnText}>
                {addingToBag ? 'Adding…' : 'Move to Bag'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.notifyBtn}
              activeOpacity={0.82}
            >
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard: React.FC<{ delay: number }> = ({ delay }) => {
  const entrance = useEntrance(delay);
  return (
    <Animated.View style={[styles.cardWrap, entrance]}>
      <View style={styles.card}>
        <View style={[styles.imgWrap, styles.skeletonImg]} />
        <View style={styles.info}>
          <View style={[styles.skeletonLine, { width: '45%' }]} />
          <View style={[styles.skeletonLine, { width: '80%', marginTop: Space[1] + 2 }]} />
          <View style={[styles.skeletonLine, { width: '35%', marginTop: Space[2] }]} />
        </View>
        <View style={styles.skeletonBtn} />
      </View>
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const insets      = useSafeAreaInsets();
  const haptic      = useHaptic();
  const { setCartCount } = useCart();
  const profileCode = useProfileCode();

  const { data: fetched, loading, isError, error, run } =
    useAsyncState<WishlistItemInterface[]>([]);

  const [items, setItems]         = useState<WishlistItemInterface[]>([]);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const hasFetched = useRef(false);

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

  // Sync fetched → items
  React.useEffect(() => {
    if (fetched && fetched.length > 0) setItems(fetched);
  }, [fetched]);

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      hasFetched.current = false;
      setItems([]);
      fetchWishlist(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchWishlist]),
  );

  const handleRemove = async (wishlistCode: number) => {
    if (!profileCode) return;
    setItems(prev => prev.filter(i => i.WishlistCode !== wishlistCode));
    await removeFromWishlist(profileCode, wishlistCode);
  };

  const handleAddToBag = async (item: WishlistItemInterface) => {
    if (!profileCode || addingIds.has(item.WishlistCode)) return;
    setAddingIds(prev => new Set(prev).add(item.WishlistCode));
    try {
      await postSaveCartItems({
        CustomerProfileCode: profileCode,
        InventoryId:         item.InventoryID,
        Quantity:            1,
        IsPurchased:         false,
      });
      haptic.success();
      setCartCount((prev: number) => prev + 1);
      toastEmitter.emit('success', 'Added to bag');
    } catch {
      toastEmitter.emit('error', 'Could not add to bag');
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(item.WishlistCode);
        return next;
      });
    }
  };

  const handlePressItem = useCallback((itemId: number) => {
    navigation.navigate('Product', { product: String(itemId) });
  }, [navigation]);

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderItem = ({ item, index }: ListRenderItemInfo<WishlistItemInterface>) => (
    <WishlistCard
      item={item}
      onRemove={handleRemove}
      onAddToBag={handleAddToBag}
      addingToBag={addingIds.has(item.WishlistCode)}
      onPress={handlePressItem}
      delay={Math.min(index * 40, 280)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIllustration}>
          <Icon name="heart-outline" size={48} color={Colors.ink3} />
        </View>
        <Text style={styles.emptyTitle}>Nothing saved yet.</Text>
        <Text style={styles.emptyBody}>
          Tap the heart on any product to save it here.
        </Text>
      </View>
      <View style={styles.emptyFooter}>
        <TouchableOpacity
          style={styles.emptyCTA}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyCTAText}>Browse the collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map(i => (
        <SkeletonCard key={i} delay={i * 50} />
      ))}
    </View>
  );

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

    if (!hasFetched.current) return renderSkeleton();

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => String(item.WishlistCode)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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

  const itemCount = items.length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Light header — Tira-style ─────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Icon name="arrow-back" size={22} color={Colors.ink1} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          My Wishlist
          {itemCount > 0 ? (
            <Text style={styles.headerCount}>{` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}</Text>
          ) : null}
        </Text>
        <View style={styles.headerRight} />
      </View>
      <View style={styles.headerDivider} />

      {renderBody()}

      <BottomNavBar
        activeTab="Wishlist"
        onNavigate={(route) => navigation.navigate(route)}
        onNavigateToAuth={(screen) => navigation.navigate(screen)}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surface,
  },

  // ── Light header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[4],
    backgroundColor:   Colors.surface,
  },
  backBtn: {
    width:  36,
    height: 36,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     -Space[2],
  },
  headerTitle: {
    flex:          1,
    fontFamily:    FontFamily.serif,
    fontSize:      22,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  headerCount: {
    fontFamily:    FontFamily.sans,
    fontSize:      18,
    fontWeight:    '400',
    color:         Colors.ink3,
    letterSpacing: -0.1,
  },
  headerRight: {
    width: 36,
  },
  headerDivider: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: Colors.rule,
  },

  // ── List ──────────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingTop:        Space[5],
    paddingBottom:     Space[10],
  },
  listContentEmpty: {
    flexGrow:       1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap:          COL_GAP,
    marginBottom: Space[6],
  },

  // ── Card ──────────────────────────────────────────────────────────────────────
  cardWrap: {
    flex: 1,
  },
  card: {
    flex: 1,
  },

  // ── Image ─────────────────────────────────────────────────────────────────────
  imgWrap: {
    width:           COL_W,
    height:          IMG_H,
    borderRadius:    0,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
    position:        'relative',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  imgPlaceholder: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  imgPlaceholderLetter: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   36,
    color:      Colors.ink4,
    lineHeight: 40,
  },

  // ── OOS overlay ───────────────────────────────────────────────────────────────
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,247,244,0.55)',
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingBottom:   Space[3],
  },
  oosBadge: {
    paddingHorizontal: Space[3],
    paddingVertical:   Space[1],
    backgroundColor:   'rgba(248,247,244,0.92)',
    borderRadius:      Radius.xs,
  },
  oosBadgeText: {
    ...Type.label,
    color:         Colors.ink3,
    letterSpacing: 0.8,
  },

  // ── Discount badge ────────────────────────────────────────────────────────────
  discountBadge: {
    position:          'absolute',
    top:               Space[2],
    left:              Space[2],
    paddingHorizontal: Space[2],
    paddingVertical:   2,
    backgroundColor:   Colors.accent,
    borderRadius:      Radius.xs,
  },
  discountBadgeText: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Remove — bare × top-right corner ─────────────────────────────────────────
  removeBtn: {
    position:        'absolute',
    top:             Space[2],
    right:           Space[2],
    width:           24,
    height:          24,
    alignItems:      'center',
    justifyContent:  'center',
  },
  removeGlyph: {
    fontSize:          18,
    lineHeight:        20,
    color:             Colors.ink1,
    fontWeight:        '300',
    textShadowColor:   'rgba(255,255,255,0.8)',
    textShadowOffset:  { width: 0, height: 0 },
    textShadowRadius:  4,
  },

  // ── Info block ────────────────────────────────────────────────────────────────
  info: {
    paddingTop: Space[2] + 2,
    gap:        3,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.serif,
    fontSize:      13,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    13 * 1.4,
  },

  // ── Move to Bag — solid black, full-width, sharp corners ─────────────────────
  bagBtn: {
    marginTop:       Space[2] + 2,
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.xs,
    paddingVertical: Space[2] + 2,
    alignItems:      'center',
  },
  bagBtnLoading: {
    backgroundColor: Colors.ink3,
  },
  bagBtnText: {
    fontFamily:    FontFamily.sans,
    fontSize:      11,
    fontWeight:    '600',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Notify Me button (OOS) ────────────────────────────────────────────────────
  notifyBtn: {
    marginTop:       Space[2] + 2,
    borderWidth:     StyleSheet.hairlineWidth,
    borderColor:     Colors.ink4,
    borderRadius:    Radius.xs,
    paddingVertical: Space[2] + 2,
    alignItems:      'center',
  },
  notifyBtnText: {
    fontFamily:    FontFamily.sans,
    fontSize:      11,
    fontWeight:    '400',
    color:         Colors.ink4,
    letterSpacing: 0.2,
  },

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    paddingHorizontal: Space.screenH,
    paddingTop:     Space[5],
    gap:            COL_GAP,
    rowGap:         Space[5],
  },
  skeletonImg: {
    borderRadius:    0,
    backgroundColor: Colors.surfaceDeep,
  },
  skeletonLine: {
    height:          9,
    borderRadius:    Radius.xs,
    backgroundColor: Colors.surfaceDeep,
  },
  skeletonBtn: {
    marginTop:       Space[2] + 2,
    height:          28,
    borderRadius:    Radius.pill,
    backgroundColor: Colors.surfaceDeep,
  },

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
  },
  emptyContent: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space[6],
    gap:               Space[4],
  },
  emptyIllustration: {
    width:           100,
    height:          100,
    borderRadius:    50,
    backgroundColor: Colors.surfaceSoft,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Space[2],
  },
  emptyTitle: {
    ...Type.title,
    textAlign: 'center',
    color:     Colors.ink1,
  },
  emptyBody: {
    ...Type.caption,
    textAlign: 'center',
    color:     Colors.ink3,
    maxWidth:  240,
  },
  emptyFooter: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[8],
    paddingTop:        Space[4],
  },
  emptyCTA: {
    backgroundColor: Colors.ink1,
    borderRadius:    Radius.pill,
    paddingVertical: Space[4],
    alignItems:      'center',
  },
  emptyCTAText: {
    ...Type.bodyStrong,
    color: '#FFFFFF',
  },
});

export default WishlistScreen;
