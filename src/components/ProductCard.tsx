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
import { Motion } from '../theme/motion';

interface ProductCardProps {
  product: ProductInterface;
  onPress?: (event: GestureResponderEvent) => void;
  cardWidth?: number;
  showHeart?: boolean;
  showDelivery?: boolean;
}


const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  cardWidth = 158,
  showHeart = true,
  showDelivery = true,
}) => {
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const imgUri = resolveImageUrl(product.Images);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const onLoad = useCallback(() => {
    setImgLoaded(true);
    Animated.timing(imgOpacity, {
      toValue: 1, duration: Motion.duration.settle, useNativeDriver: true,
    }).start();
  }, [imgOpacity]);

  const onError = useCallback(() => {
    setImgLoaded(true);
    setImgFailed(true);
  }, []);

  const hasDiscount = product.MaxComparePrice > product.MinPrice;
  const discountPct = hasDiscount && product.DiscountPct > 0 ? Math.round(product.DiscountPct) : 0;

  const isNew = (() => {
    if (!product.CreatedDate) return false;
    const created = new Date(product.CreatedDate);
    const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 30;
  })();
  const imgH = Math.round(cardWidth * 0.88);

  const freeShipping = product.ShippingInfo?.FreeShipping ?? false;
  const deliveryDays = product.ShippingInfo?.EstimatedDeliveryDays;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={[styles.imgWrap, { height: imgH, backgroundColor: Colors.surfaceDeep }]}>
        {imgUri && !imgFailed ? (
          <>
            {!imgLoaded && <Skeleton height={imgH} radius={Radius.md} style={StyleSheet.absoluteFillObject} />}
            <Animated.Image
              source={{ uri: imgUri }}
              style={[styles.img, { opacity: imgOpacity }]}
              resizeMode="cover"
              onLoad={onLoad}
              onError={onError}
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
            <Text style={styles.price} numberOfLines={1}>MUR {product.MinPrice.toLocaleString('en-IN')}</Text>
          ) : (
            <Text style={styles.priceUnavailable} numberOfLines={1}>Price unavailable</Text>
          )}
          {hasDiscount && product.MinPrice > 0 && (
            <Text style={styles.was} numberOfLines={1}>MUR {product.MaxComparePrice.toLocaleString('en-IN')}</Text>
          )}
          {discountPct > 0 && (
            <Text style={styles.discountLabel} numberOfLines={1}>−{discountPct}%</Text>
          )}
        </View>
        {product.Variant ? (
          <Text style={styles.variant} numberOfLines={1}>{product.Variant}</Text>
        ) : null}
        {showDelivery && freeShipping ? (
          <Text style={styles.delivery} numberOfLines={1}>
            Free delivery{deliveryDays ? ` · ${deliveryDays} days` : ''}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    paddingBottom:   Space[3],
  },
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
  discountLabel: {
    fontFamily:    FontFamily.mono,
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.accent,
    letterSpacing: 0.2,
  },
  info: {
    paddingTop:        Space[2],
    paddingHorizontal: Space[2],
    gap:               2,
  },
  brand: {
    fontFamily:    FontFamily.mono,
    fontSize:      8.5,
    fontWeight:    '400',
    color:         Colors.ink4,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '500',
    color:         Colors.ink1,
    lineHeight:    17,
    minHeight:     34,
    letterSpacing: -0.1,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    alignItems:    'baseline',
    gap:           Space[1] + 1,
    marginTop:     1,
  },
  price: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.2,
    flexShrink:    0,
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
  delivery: {
    ...Type.caption,
    fontSize:   10.5,
    color:      Colors.success,
  },
});

export default ProductCard;
