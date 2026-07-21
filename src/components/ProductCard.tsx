import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { ProductInterface } from '../api/interfaces';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { WishlistHeart } from './ui/WishlistHeart';
import { QuickAddButton } from './ui/QuickAddButton';
import { Colors, Space, Radius } from '../theme';
import { Type } from '../theme/typography';
import { FontFamily } from '../theme/fonts';
import { discountPct as calcDiscountPct } from '../utils/pricing';
import { isProductSoldOut } from '../utils/stock';

interface ProductCardProps {
  product: ProductInterface;
  onPress?: (event: GestureResponderEvent) => void;
  cardWidth?: number;
  showHeart?: boolean;
  showDelivery?: boolean;
  showQuickAdd?: boolean;
}


const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  cardWidth = 158,
  showHeart = true,
  showDelivery = true,
  showQuickAdd = false,
}) => {
  const imgUri = resolveImageUrl(product.Images);
  const [imgFailed, setImgFailed] = useState(false);

  const onError = useCallback(() => {
    setImgFailed(true);
  }, []);

  // A product reads as sold out only when every one of its variants is
  // unavailable — not just the first (e.g. one size out of stock shouldn't
  // hide the whole product), and backorderable variants stay purchasable.
  const isOOS = isProductSoldOut(product.Variants);
  const discountPct = calcDiscountPct(product.MinPrice, product.MaxComparePrice);
  const hasDiscount = !isOOS && discountPct > 0;

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
      <View style={[styles.imgWrap, { height: imgH, backgroundColor: '#FFFFFF' }]}>
        {imgUri && !imgFailed ? (
          <Image
            source={{ uri: imgUri }}
            style={[styles.img, isOOS && styles.imgOOS]}
            resizeMode="contain"
            onError={onError}
          />
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

        {showQuickAdd ? <QuickAddButton product={product} /> : null}
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
          {isOOS ? (
            <View style={styles.oosChip}>
              <Text style={styles.oosChipText} numberOfLines={1}>Sold Out</Text>
            </View>
          ) : hasDiscount ? (
            <View style={styles.discountChip}>
              <Text style={styles.discountChipText} numberOfLines={1}>−{discountPct}%</Text>
            </View>
          ) : null}
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
  imgOOS: {
    opacity: 0.5,
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
    ...Type.label,
    fontSize:      9,
    color:         '#FFFFFF',
    letterSpacing: 1.2,
  },
  discountChip: {
    backgroundColor:   Colors.accent,
    borderRadius:      5,
    paddingVertical:   2,
    paddingHorizontal: 6,
  },
  discountChipText: {
    ...Type.label,
    fontSize:      10.5,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
  oosChip: {
    backgroundColor:   Colors.ink3,
    borderRadius:      5,
    paddingVertical:   2,
    paddingHorizontal: 6,
  },
  oosChipText: {
    ...Type.label,
    fontSize:      10.5,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
  info: {
    paddingTop:        Space[2],
    paddingHorizontal: Space[2],
    gap:               2,
  },
  brand: {
    ...Type.label,
    fontSize: 8.5,
    color:    Colors.ink4,
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
    fontFamily:         FontFamily.sans,
    fontSize:           12,
    fontWeight:         '400',
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
    color:      Colors.brandNavy,
  },
});

export default ProductCard;
