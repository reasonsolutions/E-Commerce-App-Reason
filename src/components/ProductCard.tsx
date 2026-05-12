import React, { useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, GestureResponderEvent } from 'react-native';
import { ProductInterface } from '../api/interfaces';
import { Colors, Space, Radius, FontSize, FontWeight } from '../theme';

// Card width is fixed so FlatList snap interval math (HomeScreen) is unchanged.
const CARD_W = 180;

interface ProductCardProps {
  product: ProductInterface;
  onPress?: (event: GestureResponderEvent) => void;
  onFavoritePress?: (product: ProductInterface) => void;
  tall?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, tall = false }) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  // Portrait-first ratios — tall card is significantly taller for visible rhythm contrast
  const imgH = tall ? CARD_W * 1.48 : CARD_W * 1.18;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Image — no container shadow or border. Imagery is the frame. */}
      <View style={[styles.imgWrap, { height: imgH }]}>
        <Animated.Image
          source={{ uri: product.Images?.split(';')[0] || '' }}
          style={[styles.img, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />
        {hasDiscount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPct}%</Text>
          </View>
        )}
      </View>

      {/* Typography block — bare, no card background */}
      <View style={styles.info}>
        {product.Brand_Name ? (
          <Text style={styles.brand} numberOfLines={1}>{product.Brand_Name}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>{product.Name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${product.Price.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.was}>${product.ComparePrice.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
  },
  imgWrap: {
    width: CARD_W,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: Space[2],
    left: Space[2],
    backgroundColor: Colors.danger,
    borderRadius: Radius.xs,
    paddingVertical: 2,
    paddingHorizontal: Space[1] + 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  info: {
    paddingTop: Space[2] + 2,
    paddingHorizontal: 2,
    gap: 2,
  },
  brand: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.ink4,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.ink1,
    letterSpacing: -0.1,
    lineHeight: FontSize.sm * 1.35,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Space[1] + 2,
    marginTop: 2,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.ink1,
    letterSpacing: -0.2,
  },
  was: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.ink4,
    textDecorationLine: 'line-through',
  },
});

export default ProductCard;
