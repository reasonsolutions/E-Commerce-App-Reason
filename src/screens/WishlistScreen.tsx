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
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/storageKeys';
import { getWishlist, removeFromWishlist } from '../api/services';
import { WishlistItemInterface } from '../api/mock/mockData';
import { EmptyState, Button, BottomNavBar } from '../components/ui';
import { ErrorState } from '../components/system';
import { Colors, Space, Radius, Shadow, FontSize, FontWeight } from '../theme';
import { useAsyncState } from '../hooks/useAsyncState';

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
};

type WishlistScreenProps = {
  navigation: NavigationProp;
};

function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return { opacity, transform: [{ translateY }] };
}

// ── Single wishlist row ───────────────────────────────────────────────────────
const WishlistRow: React.FC<{
  item: WishlistItemInterface;
  onRemove: (code: number) => void;
  onPress: (inventoryId: number) => void;
  delay: number;
}> = ({ item, onRemove, onPress, delay }) => {
  const anim       = useEntrance(delay);
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const onLoad     = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = item.ComparePrice > item.Price;

  return (
    <Animated.View style={[styles.row, anim]}>
      <TouchableOpacity
        style={styles.rowInner}
        activeOpacity={0.82}
        onPress={() => onPress(item.Inventory_Id)}
      >
        {/* Image */}
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
          {item.Variant ? (
            <Text style={styles.variant}>{item.Variant}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.Price.toFixed(2)}</Text>
            {hasDiscount && (
              <Text style={styles.comparePrice}>${item.ComparePrice.toFixed(2)}</Text>
            )}
          </View>
        </View>

        {/* Remove */}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.WishlistItemCode)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="close" size={15} color={Colors.ink4} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────
const WishlistScreen: React.FC<WishlistScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Fetched list — owned by useAsyncState for loading/error lifecycle
  const { data: fetched, loading, isError, error, run } = useAsyncState<WishlistItemInterface[]>([]);

  // Local mutable copy seeded from fetched — lets remove work optimistically
  // without triggering a full refetch on every deletion.
  const [items, setItems] = useState<WishlistItemInterface[]>([]);
  const [profileCode, setProfileCode] = useState<number | null>(null);

  // Sync local list whenever a successful fetch completes
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
    // Optimistic removal — revert is implicit on next focus refetch if it fails
    setItems(prev => prev.filter(i => i.WishlistItemCode !== wishlistItemCode));
    await removeFromWishlist(profileCode, wishlistItemCode);
  };

  const renderItem = ({ item, index }: ListRenderItemInfo<WishlistItemInterface>) => (
    <WishlistRow
      item={item}
      onRemove={handleRemove}
      onPress={(id) => navigation.navigate('Product', { product: String(id) })}
      delay={index * 60}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon={<Icon name="heart-outline" size={32} color={Colors.ink3} />}
      title="Nothing saved yet"
      body="Items you save will appear here"
      action={
        <Button variant="primary" size="md" onPress={() => navigation.navigate('Home')}>
          Start Shopping
        </Button>
      }
    />
  );

  const itemCount = items.length;

  const renderBody = () => {
    if (isError) {
      return (
        <View style={styles.errorWrap}>
          <ErrorState
            title="Couldn't load wishlist"
            message={error ?? 'An unexpected error occurred.'}
            onRetry={() => fetchWishlist()}
            retryLoading={loading}
            icon={<Icon name="heart-outline" size={32} color={Colors.ink3} />}
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dark editorial header */}
      <View style={[styles.header, { paddingTop: insets.top + Space[3] }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>SAVED ITEMS</Text>
            <Text style={styles.displayTitle}>
              {itemCount === 0 ? 'Wishlist' : `${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Tonal bridge */}
      <LinearGradient
        colors={['#0A0A0A', Colors.surfaceAlt]}
        style={styles.bridge}
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
    backgroundColor: Colors.surfaceAlt,
  },

  // ── Header ──
  header: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[5],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space[3],
  },
  headerLeft: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.38)',
    letterSpacing: 1.4,
  },
  displayTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: FontSize['2xl'] * 1.15,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // ── Bridge ──
  bridge: {
    height: 48,
    marginTop: -1,
  },

  // ── List ──
  list: {
    flex: 1,
    marginTop: -Space[3],
  },
  listContent: {
    paddingHorizontal: Space.screenH,
    paddingBottom: Space[8],
    gap: Space[3],
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // ── Error ──
  errorWrap: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    marginTop: -Space[3],
  },

  // ── Row ──
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    ...Shadow.md,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Space[4],
    gap: Space[3],
  },
  imgWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
    flexShrink: 0,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  brand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink4,
    letterSpacing: 0.9,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: FontSize.base * 1.3,
  },
  variant: {
    fontSize: FontSize.xs,
    color: Colors.ink4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Space[2],
    marginTop: 2,
  },
  price: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
  comparePrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.ink4,
    textDecorationLine: 'line-through',
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default WishlistScreen;
