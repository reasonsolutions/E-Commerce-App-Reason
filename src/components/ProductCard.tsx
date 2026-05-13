import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { ProductInterface } from '../api/interfaces';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

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
    Animated.timing(imgOpacity, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const hasDiscount = product.ComparePrice > product.Price;
  const discountPct = hasDiscount
    ? Math.round(((product.ComparePrice - product.Price) / product.ComparePrice) * 100)
    : 0;

  // 4:5 portrait ratio per spec B12. Tall variant for first card in shelf.
  const imgH = tall ? CARD_W * 1.48 : CARD_W * 1.25;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
      {/* surfaceDeep bg so transparent product images don't dissolve */}
      <View style={[styles.imgWrap, { height: imgH }]}>
        <Animated.Image
          source={{ uri: product.Images?.split(';')[0] || '' }}
          style={[styles.img, { opacity: imgOpacity }]}
          resizeMode="cover"
          onLoad={onLoad}
        />

        {/* Ember badge — top-left, mono label per spec A7 */}
        {hasDiscount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPct}%</Text>
          </View>
        )}
      </View>

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
    width:           CARD_W,
    borderRadius:    Radius.md,
    overflow:        'hidden',
    backgroundColor: Colors.surfaceDeep,
    position:        'relative',
  },
  img: {
    width:  '100%',
    height: '100%',
  },
  // Ember tint + ember border — reads as a label, not a danger chip
  badge: {
    position:          'absolute',
    top:               10,
    left:              10,
    backgroundColor:   Colors.accentTint,
    borderRadius:      Radius.xs,
    paddingVertical:   2,
    paddingHorizontal: 5,
    borderWidth:       0.5,
    borderColor:       Colors.accent,
  },
  badgeText: {
    ...Type.label,
    color:         Colors.accent,
    letterSpacing: 0.4,
    textTransform: 'none',
  },
  info: {
    paddingTop:        Space[2] + 2,
    paddingHorizontal: 2,
    gap:               3,
  },
  brand: {
    ...Type.label,
    color: Colors.ink4,
  },
  name: {
    fontFamily:    FontFamily.serif,
    fontSize:      14,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    lineHeight:    19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[1] + 2,
    marginTop:     2,
  },
  price: {
    fontFamily:    FontFamily.serif,
    fontSize:      15,
    fontWeight:    '400',
    color:         Colors.ink1,
    letterSpacing: -0.3,
  },
  was: {
    ...Type.caption,
    textDecorationLine: 'line-through',
    color:              Colors.ink4,
  },
});

export default ProductCard;
