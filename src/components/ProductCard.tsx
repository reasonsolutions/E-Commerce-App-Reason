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
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { Skeleton } from './ui';
import { WishlistHeart } from './ui/WishlistHeart';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';

interface ProductCardProps {
  product: ProductInterface;
  onPress?: (event: GestureResponderEvent) => void;
  cardWidth?: number;
  showHeart?: boolean;
}

const TONE_GRADS: [string, string][] = [
  ['#E9E1D3', '#D9CBB7'], ['#DEE2DC', '#C8CEC5'], ['#EADBCF', '#D7C0AF'],
  ['#DEDFDA', '#C7C9C2'], ['#ECE5D7', '#DBD0BB'], ['#DCD7CF', '#C4BCAE'],
  ['#E9DCD5', '#D4C0B5'], ['#D9D8C6', '#C2C0A6'], ['#D6DADD', '#BFC5C9'],
];

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  cardWidth = 158,
  showHeart = true,
}) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const imgUri = resolveImageUrl(product.Images);
  const toneIdx = product.ItemID % TONE_GRADS.length;
  const [t0] = TONE_GRADS[toneIdx];

  const onLoad = useCallback(() => {
    Animated.timing(imgOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  // Guard: only show discount when ComparePrice > Price (server DiscountPct can be wrong)
  const hasDiscount = product.MaxComparePrice > product.MinPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.MaxComparePrice - product.MinPrice) / product.MaxComparePrice) * 100)
    : 0;

  const imgH = Math.round(cardWidth * 1.25);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={[styles.imgWrap, { height: imgH, backgroundColor: t0 }]}>
        {imgUri ? (
          <>
            <Skeleton height={imgH} radius={Radius.md} style={StyleSheet.absoluteFillObject} />
            <Animated.Image
              source={{ uri: imgUri }}
              style={[styles.img, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
            />
          </>
        ) : (
          <Text style={styles.initial}>{(product.Name || '?').charAt(0)}</Text>
        )}

        {hasDiscount && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPct}%</Text>
          </View>
        )}

        {showHeart && product.Inventory_Id ? (
          <WishlistHeart inventoryId={product.Inventory_Id} />
        ) : null}
      </View>

      <View style={styles.info}>
        {product.BrandName ? (
          <Text style={styles.brand} numberOfLines={1}>{product.BrandName.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.name} numberOfLines={2}>{product.Name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>Rs {product.MinPrice.toLocaleString('en-IN')}</Text>
          {hasDiscount && (
            <Text style={styles.was}>Rs {product.MaxComparePrice.toLocaleString('en-IN')}</Text>
          )}
        </View>
        {product.Variant ? (
          <Text style={styles.variant} numberOfLines={1}>{product.Variant}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {},
  imgWrap: {
    borderRadius:   Radius.md,
    overflow:       'hidden',
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
  },
  img: {
    ...StyleSheet.absoluteFillObject,
  },
  initial: {
    fontFamily: FontFamily.serifItalic,
    fontSize:   52,
    color:      'rgba(40,32,24,0.18)',
    lineHeight: 56,
  },
  // Discount badge — bottom-left, frosted white per design
  badge: {
    position:          'absolute',
    left:              8,
    bottom:            8,
    paddingVertical:   3,
    paddingHorizontal: 7,
    borderRadius:      6,
    backgroundColor:   'rgba(255,255,255,0.90)',
  },
  badgeText: {
    fontFamily:    FontFamily.sans,
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.accent,
    letterSpacing: 0.2,
  },
  info: {
    paddingTop: Space[2] + 1,
    gap:        3,
  },
  brand: {
    ...Type.label,
    color:         Colors.ink4,
    letterSpacing: 1.6,
    fontSize:      9.5,
  },
  name: {
    fontFamily:    FontFamily.sans,
    fontSize:      13.5,
    fontWeight:    '600',
    color:         Colors.ink1,
    lineHeight:    18,
    letterSpacing: -0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           Space[1] + 2,
  },
  price: {
    fontFamily:    FontFamily.sans,
    fontSize:      14,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.1,
  },
  was: {
    ...Type.caption,
    textDecorationLine: 'line-through',
    color:              Colors.ink4,
  },
  variant: {
    ...Type.caption,
    color:      Colors.ink4,
    letterSpacing: 0.1,
  },
});

export default ProductCard;
