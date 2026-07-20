import React, { useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';
import { getWishlist, removeFromWishlist } from '../api/wishlist';
import { postSaveCartItems } from '../api/cart';
import type { WishlistItemInterface } from '../api/interfaces';
import { Price, SkeletonGrid, TrustLine, FadeImage } from '../components/ui';
import { ErrorState } from '../components/system';
import { STORAGE_KEYS, scopedKey } from '../config/storageKeys';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';
import { useTabRootBackHandler } from '../hooks/useTabRootBackHandler';
import { useCart } from '../context/CartContext';
import { toastEmitter } from '../utils/toastEmitter';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { wishlistCache } from '../utils/wishlistCache';

// ── Grid dimensions — mirrors ResultScreen.styles.ts ─────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const COL_GAP  = Space[3];
const COL_W    = (SCREEN_W - Space.screenH * 2 - COL_GAP) / 2;
const IMG_H    = COL_W * 1.25; // 4:5 portrait

type WishlistScreenProps = {
  navigation: StackNavigationProp<RootStackParamList>;
};

// ── Grid card ─────────────────────────────────────────────────────────────────
const WishlistCard: React.FC<{
  item:         WishlistItemInterface;
  onRemove:     (code: number) => void;
  onAddToBag:   (item: WishlistItemInterface) => void;
  addingToBag:  boolean;
  onPress:      (itemId: number) => void;
  delay:        number;
}> = React.memo(({ item, onRemove, onAddToBag, addingToBag, onPress, delay }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
  const { animatedStyle: pressStyle, handlers } = useTactile();

  const price        = item.PriceDetails?.Price ?? 0;
  const comparePrice = item.PriceDetails?.ComparePrice ?? 0;
  const hasDiscount  = comparePrice > price;
  const isOOS        = item.IsInStock === 0;
  const imageUri     = resolveImageUrl(Array.isArray(item.Images) ? item.Images[0] : item.Images);

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
            <FadeImage
              uri={imageUri}
              width={COL_W}
              height={IMG_H}
              resizeMode="contain"
              fallbackText={item.BrandName || item.Name}
              style={styles.imgBackdrop}
            />

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
              accessibilityLabel="Remove from wishlist"
              accessibilityRole="button"
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
              accessibilityLabel="Move to bag"
              accessibilityRole="button"
            >
              <Text style={styles.bagBtnText}>
                {addingToBag ? 'Adding…' : 'Move to Bag'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.notifyBtn}
              activeOpacity={0.82}
              onPress={() => toastEmitter.emit('info', "We'll notify you when this is back in stock")}
              accessibilityLabel="Notify me when back in stock"
              accessibilityRole="button"
            >
              <Text style={styles.notifyBtnText}>Notify Me</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});


const getProfileCode = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.userData);
  if (!raw) return null;
  return JSON.parse(raw).CustomerProfileCode ?? null;
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const insets      = useSafeAreaInsets();
  const haptic      = useHaptic();
  const { setCartCount } = useCart();
  useTabRootBackHandler(navigation);

  // Bottom-tab siblings stay mounted at all times and each set their own
  // StatusBar style — RN merges state from every mounted instance app-wide,
  // so another tab's style can win even after switching back here. Reassert
  // on every focus rather than relying solely on the declarative <StatusBar>
  // below (see HomeScreen.tsx for the same fix / fuller rationale).
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
    }, []),
  );

  const { data: fetched, loading, isError, error, run } =
    useAsyncState<WishlistItemInterface[]>([]);

  const [items, setItems]         = useState<WishlistItemInterface[]>([]);
  const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
  const [isFTU, setIsFTU]         = useState(false);
  const [isGuest, setIsGuest]     = useState(false);
  const [profileCode, setProfileCode] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const STALE_MS = 30_000;

  const fetchWishlist = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const code = await getProfileCode();
        if (!code) { setIsGuest(true); return []; }
        setIsGuest(false);
        setProfileCode(code);
        const response = await getWishlist(code);
        const result = response.statusCode === 1 ? (response.result || []) : [];
        wishlistCache.markFresh();
        // FTU detection: empty result + wishlistSeen not yet set
        if (result.length === 0) {
          const seen = await AsyncStorage.getItem(scopedKey('wishlistSeen', code));
          if (!seen) {
            setIsFTU(true);
            await AsyncStorage.setItem(scopedKey('wishlistSeen', code), '1');
          } else {
            setIsFTU(false);
          }
        } else {
          setIsFTU(false);
        }
        return result;
      }, cancelled),
    [run],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    wishlistCache.invalidate();
    await fetchWishlist();
    setRefreshing(false);
  }, [fetchWishlist]);

  // Sync fetched → items (including clearing to empty, so removals elsewhere reflect correctly)
  React.useEffect(() => {
    if (fetched) setItems(fetched);
  }, [fetched]);

  useFocusEffect(
    useCallback(() => {
      const stale = Date.now() - wishlistCache.lastFetchTime > STALE_MS;
      if (!stale) return;
      const cancelled = { current: false };
      fetchWishlist(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchWishlist]),
  );

  const handleRemove = useCallback(async (wishlistCode: number) => {
    if (!profileCode) return;
    setItems(prev => prev.filter(i => i.WishlistCode !== wishlistCode));
    await removeFromWishlist(profileCode, wishlistCode);
    const res = await getWishlist(profileCode);
    if (res.statusCode === 1) { setItems(res.result); wishlistCache.markFresh(); }
  }, [profileCode]);

  const handleAddToBag = useCallback(async (item: WishlistItemInterface) => {
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
      toastEmitter.emit('success', 'Moved to bag');
      // Remove from wishlist atomically after successful cart add
      try {
        await removeFromWishlist(profileCode, item.WishlistCode);
        setItems(prev => prev.filter(w => w.WishlistCode !== item.WishlistCode));
        wishlistCache.markFresh();
      } catch {
        // Cart add succeeded — don't block the user, wishlist will sync on next focus
      }
    } catch {
      toastEmitter.emit('error', 'Could not add to bag');
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev);
        next.delete(item.WishlistCode);
        return next;
      });
    }
  }, [profileCode, addingIds, haptic, setCartCount]);

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
      delay={Motion.stagger.delay(index)}
    />
  );

  const renderGuestEmpty = () => (
    <View style={[styles.listContentEmpty, styles.stateWrap]}>
      <View style={styles.emptyInner}>
        <View style={styles.emptyIconCircle}>
          <Icon name="person-outline" size={22} color={Colors.ink4} />
        </View>
        <Text style={styles.emptyTitle}>Sign in to view your wishlist.</Text>
        <Text style={styles.emptyBody}>
          Save products you love and find them here after signing in.
        </Text>
        <TouchableOpacity
          style={styles.emptyCTA}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.emptyCTAText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.emptySecondary}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Home')}
          accessibilityRole="button"
          accessibilityLabel="Continue shopping"
        >
          <Text style={styles.emptySecondaryText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isFTU) {
      return (
        <View style={[styles.listContentEmpty, styles.stateWrap]}>
          <View style={styles.emptyInner}>
            <View style={styles.emptyIconCircle}>
              <Icon name="heart-outline" size={22} color={Colors.ink3} />
            </View>
            <Text style={styles.emptyTitle}>Save things you love.</Text>
            <Text style={styles.emptyBody}>
              While browsing, tap ♡ on any product to find it here later.
            </Text>
            <TrustLine message="Your wishlist is private to your account" />
            <TouchableOpacity
              style={styles.emptyCTA}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Home')}
              accessibilityRole="button"
              accessibilityLabel="Start shopping"
            >
              <Text style={styles.emptyCTAText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.listContentEmpty, styles.stateWrap]}>
        <View style={styles.emptyInner}>
          <View style={styles.emptyIconCircle}>
            <Icon name="heart-outline" size={22} color={Colors.ink4} />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty.</Text>
          <Text style={styles.emptyBody}>
            Tap ♡ on any product to save it here for later.
          </Text>
          <TouchableOpacity
            style={styles.emptyCTA}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('Home')}
            accessibilityRole="button"
            accessibilityLabel="Start shopping"
          >
            <Text style={styles.emptyCTAText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.stateWrap}>
      <SkeletonGrid cols={2} rows={2} showPriceLine showButton />
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

    if (isGuest) return renderGuestEmpty();

    if (!wishlistCache.lastFetchTime) return renderSkeleton();

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={wishlistCache.lastFetchTime && !loading ? renderEmpty : null}
        style={styles.list}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
      />
    );
  };

  const itemCount = items.length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* ── Light header — Tira-style ─────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
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
    flex:        1,
    fontFamily:  FontFamily.serif,
    fontSize:    26,
    fontWeight:  '600',
    color:       Colors.ink1,
    letterSpacing: -0.1,
  },
  headerCount: {
    fontFamily:    FontFamily.sans,
    fontSize:      15,
    fontWeight:    '600',
    color:         Colors.ink4,
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
    backgroundColor: Colors.surface,
    overflow:        'hidden',
    position:        'relative',
  },
  // resizeMode="contain" letterboxes when a photo's aspect ratio doesn't
  // match the 4:5 box — white backdrop reads as an intentional product
  // backdrop (matches ProductScreen's hero) rather than a grey gap.
  imgBackdrop: {
    backgroundColor: '#FFFFFF',
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
    position:            'absolute',
    top:                 12,
    left:                0,
    paddingHorizontal:   Space[2],
    paddingVertical:     4,
    backgroundColor:     Colors.emberBright,
    borderTopRightRadius:    6,
    borderBottomRightRadius: 6,
  },
  discountBadgeText: {
    ...Type.label,
    fontSize:      11,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ── Remove — white circular button, top-right corner ─────────────────────────
  removeBtn: {
    position:        'absolute',
    top:             Space[1],
    right:           Space[1],
    width:           27,
    height:          27,
    borderRadius:    13.5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  removeGlyph: {
    fontSize:          16,
    lineHeight:        18,
    color:             Colors.ink1,
    fontWeight:        '400',
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
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '500',
    color:         Colors.ink1,
    letterSpacing: -0.1,
    lineHeight:    13 * 1.4,
  },

  // ── Move to Bag — solid black, full-width, sharp corners ─────────────────────
  bagBtn: {
    marginTop:       Space[2] + 2,
    backgroundColor: Colors.brandNavy,
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

  // ── State wrappers ────────────────────────────────────────────────────────────
  stateWrap: {
    flex: 1,
    paddingTop: Space[5],
  },

  // ── Empty state ───────────────────────────────────────────────────────────────
  emptyInner: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Space[6],
    paddingVertical:   Space[8],
    gap:               Space[3],
  },
  emptyIconCircle: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: Colors.surfaceDeep,
    alignItems:      'center',
    justifyContent:  'center',
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
    maxWidth:  260,
  },
  emptyCTA: {
    marginTop:       Space[4],
    height:          52,
    width:           '100%',
    backgroundColor: Colors.brandNavy,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  emptyCTAText: {
    ...Type.bodyStrong,
    color:    '#FFFFFF',
    fontSize: 15,
  },
  emptySecondary: {
    alignItems:      'center',
    paddingVertical: Space[2],
  },
  emptySecondaryText: {
    ...Type.caption,
    color:              Colors.ink3,
    textDecorationLine: 'underline',
  },
});

export default WishlistScreen;
