import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { getWishlist, removeFromWishlist } from '../api/services';
import { WishlistItemInterface } from '../api/mock/mockData';
import { EmptyState, BottomNavBar, Price } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { Motion } from '../theme/motion';
import { useAsyncState } from '../hooks/useAsyncState';
import { useEntrance } from '../hooks/useEntrance';
import { useHaptic } from '../hooks/useHaptic';
import { useTactile } from '../hooks/useTactile';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type WishlistScreenProps = {
  navigation: NavigationProp;
};

// Image dimensions — 4:5 portrait, matching the canonical card ratio
const IMG_W = 80;
const IMG_H = 100;

// ── Single wishlist row ───────────────────────────────────────────────────────
const WishlistRow: React.FC<{
  item: WishlistItemInterface;
  onRemove: (code: number) => void;
  onPress: (inventoryId: number) => void;
  delay: number;
  isLast: boolean;
}> = ({ item, onRemove, onPress, delay, isLast }) => {
  const haptic    = useHaptic();
  const entrance  = useEntrance(delay);
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

  const hasDiscount = item.ComparePrice > item.Price;

  return (
    <Animated.View style={entrance}>
      <Animated.View style={pressStyle}>
        <TouchableOpacity
          {...handlers}
          style={styles.row}
          activeOpacity={1}
          onPress={() => { haptic.light(); onPress(item.Inventory_Id); }}
        >
          {/* Portrait image */}
          <View style={styles.imgWrap}>
            <Animated.Image
              source={{ uri: item.Images.split(';')[0] }}
              style={[styles.img, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {item.Brand_Name ? (
              <Text style={styles.brand}>{item.Brand_Name.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>{item.Name}</Text>
            {item.Variant && item.Variant !== 'ONESIZE' ? (
              <Text style={styles.variant}>{item.Variant}</Text>
            ) : null}
            <View style={styles.priceRow}>
              <Price
                value={item.Price}
                was={hasDiscount ? item.ComparePrice : undefined}
                size="base"
              />
            </View>
          </View>

          {/* Remove — plain × glyph, no circle background (CartScreen pattern) */}
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => { haptic.light(); onRemove(item.WishlistItemCode); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.removeGlyph}>×</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>

      {/* Hairline divider — not shown after last item */}
      {!isLast && <View style={styles.divider} />}
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { data: fetched, loading, isError, error, run } = useAsyncState<WishlistItemInterface[]>([]);
  const [items, setItems] = useState<WishlistItemInterface[]>([]);
  const [profileCode, setProfileCode] = useState<number | null>(null);

  useEffect(() => {
    if (fetched !== null) setItems(fetched);
  }, [fetched]);

  const fetchWishlist = useCallback(
    (cancelled?: { current: boolean }) =>
      run(async () => {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.userData);
        if (!userData) return [];
        const user = JSON.parse(userData);
        setProfileCode(user.CustomerProfileCode);
        const response = await getWishlist(user.CustomerProfileCode);
        return response.statusCode === 1 ? (response.result || []) : [];
      }, cancelled),
    [run],
  );

  useFocusEffect(
    useCallback(() => {
      const cancelled = { current: false };
      fetchWishlist(cancelled);
      return () => { cancelled.current = true; };
    }, [fetchWishlist]),
  );

  const handleRemove = async (wishlistItemCode: number) => {
    if (!profileCode) return;
    setItems(prev => prev.filter(i => i.WishlistItemCode !== wishlistItemCode));
    await removeFromWishlist(profileCode, wishlistItemCode);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<WishlistItemInterface>) => (
    <WishlistRow
      item={item}
      onRemove={handleRemove}
      onPress={(id) => navigation.navigate('Product', { product: String(id) })}
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
            title="Couldn't load wishlist"
            message={error ?? 'Something went wrong.'}
            onRetry={() => fetchWishlist()}
            retryLoading={loading}
          />
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => String(item.WishlistItemCode)}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : renderEmpty}
        style={styles.list}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.ink1} translucent />

      {/* Dark editorial header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[2] }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerEyebrow}>SAVED ITEMS</Text>
            <Text style={styles.headerTitle}>
              {itemCount === 0 ? 'Wishlist' : `${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'}`}
            </Text>
          </View>

          {/* Spacer — keeps title block centred against back btn */}
          <View style={styles.headerRight} />
        </View>
        {/* Single hairline seam — matches ResultScreen/frozen header pattern */}
        <View style={styles.headerSeam} />
      </View>

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

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.ink1,
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    paddingHorizontal: Space[3],
    gap: 3,
  },
  headerEyebrow: {
    ...Type.label,
    color: 'rgba(255,255,255,0.30)',
  },
  headerTitle: {
    fontFamily:    FontFamily.serif,
    fontSize:      26,
    fontWeight:    '400',
    color:         '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight:    26 * 1.1,
  },
  headerRight: {
    width: 36,
  },
  headerSeam: {
    height:          StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop:       Space[4],
    marginHorizontal: -Space.screenH,
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

  // ── Image — 4:5 portrait ──────────────────────────────────────────────────────
  imgWrap: {
    width:           IMG_W,
    height:          IMG_H,
    borderRadius:    Radius.sm,
    backgroundColor: Colors.surfaceDeep,
    overflow:        'hidden',
    flexShrink:      0,
  },
  img: {
    width:  '100%',
    height: '100%',
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
