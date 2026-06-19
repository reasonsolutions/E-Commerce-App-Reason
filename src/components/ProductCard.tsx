import React, { useRef, useCallback, useState } from 'react';
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


const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  cardWidth = 158,
  showHeart = true,
}) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const imgUri = resolveImageUrl(product.Images);
  const [imgLoaded, setImgLoaded] = useState(false);

  const onLoad = useCallback(() => {
    setImgLoaded(true);
    Animated.timing(imgOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  // Guard: only show discount when ComparePrice > Price (server DiscountPct can be wrong)
  const hasDiscount = product.MaxComparePrice > product.MinPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.MaxComparePrice - product.MinPrice) / product.MaxComparePrice) * 100)
    : 0;

  const isNew = (() => {
    if (!product.CreatedDate) return false;
    const created = new Date(product.CreatedDate);
    const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 30;
  })();
  const imgH = Math.round(cardWidth * 1.0);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={[styles.imgWrap, { height: imgH, backgroundColor: Colors.surfaceSoft }]}>
        {imgUri ? (
          <>
            {!imgLoaded && <Skeleton height={imgH} radius={Radius.md} style={StyleSheet.absoluteFillObject} />}
            <Animated.Image
              source={{ uri: imgUri }}
              style={[styles.img, { opacity: imgOpacity }]}
              resizeMode="contain"
              onLoad={onLoad}
            />
          </>
        ) : (
          <Text style={styles.initial}>{(product.Name || '?').charAt(0)}</Text>
        )}

        {isNew && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionBadgeText}>NEW</Text>
          </View>
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
          {product.MinPrice > 0 ? (
            <Text style={styles.price}>Rs {product.MinPrice.toLocaleString('en-IN')}</Text>
          ) : (
            <Text style={styles.priceUnavailable}>Price unavailable</Text>
          )}
          {hasDiscount && product.MinPrice > 0 && (
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
  conditionBadge: {
    position:          'absolute',
    top:               8,
    left:              8,
    paddingVertical:   3,
    paddingHorizontal: 7,
    borderRadius:      6,
    backgroundColor:   Colors.ink1,
  },
  conditionBadgeText: {
    fontFamily:    FontFamily.mono,
    fontSize:      9,
    fontWeight:    '700',
    color:         '#FFFFFF',
    letterSpacing: 1.2,
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
    minHeight:     36,
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
  priceUnavailable: {
    fontFamily:  FontFamily.sans,
    fontSize:    12,
    fontWeight:  '400',
    color:       Colors.ink4,
    fontStyle:   'italic',
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
