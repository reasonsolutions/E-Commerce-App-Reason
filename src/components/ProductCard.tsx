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
import { isProductSoldOut } from '../utils/stock';

interface ProductCardProps {
  product: ProductInterface;
  onPress?: (event: GestureResponderEvent) => void;
  cardWidth?: number;
  showHeart?: boolean;
  showQuickAdd?: boolean;
}


const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  onPress,
  cardWidth = 158,
  showHeart = true,
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
  const discountPct = product.DiscountPct ?? 0;
  const hasDiscount = discountPct > 0;
  const imgH = Math.round(cardWidth * 0.88);

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

        {isOOS ? (
          <View style={styles.oosBadge}>
            <Text style={styles.oosBadgeText} numberOfLines={1}>Sold out</Text>
          </View>
        ) : hasDiscount ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText} numberOfLines={1}>−{discountPct}%</Text>
          </View>
        ) : null}

        {showHeart && product.Inventory_Id ? (
          <WishlistHeart inventoryId={product.Inventory_Id} />
        ) : null}

        {showQuickAdd ? <QuickAddButton product={product} /> : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.BrandName ? product.BrandName.toUpperCase() : ' '}
        </Text>
        <Text style={styles.name} numberOfLines={2}>{product.Name}</Text>
        <View style={styles.priceBlock}>
          <View style={styles.priceRow}>
            {product.MinPrice > 0 ? (
              <Text style={styles.price} numberOfLines={1}>MUR {product.MinPrice.toLocaleString('en-IN')}</Text>
            ) : (
              <Text style={styles.priceUnavailable} numberOfLines={1}>Price unavailable</Text>
            )}
          </View>
          {hasDiscount && product.MinPrice > 0 ? (
            <Text style={styles.was} numberOfLines={1}>MUR {product.MaxComparePrice.toLocaleString('en-IN')}</Text>
          ) : null}
        </View>
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
  discountBadge: {
    position:          'absolute',
    top:               8,
    left:              8,
    paddingVertical:   3,
    paddingHorizontal: 7,
    borderRadius:      Radius.xs,
    backgroundColor:   Colors.accent,
  },
  discountBadgeText: {
    ...Type.label,
    fontSize:      9.5,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
  oosBadge: {
    position:          'absolute',
    top:               8,
    left:              8,
    paddingVertical:   3,
    paddingHorizontal: 7,
    borderRadius:      Radius.xs,
    backgroundColor:   Colors.ink3,
  },
  oosBadgeText: {
    ...Type.label,
    fontSize:      9.5,
    fontWeight:    '800',
    color:         '#FFFFFF',
    letterSpacing: 0.2,
  },
  info: {
    paddingTop:        Space[2],
    paddingHorizontal: Space[2],
  },
  brand: {
    ...Type.label,
    fontSize:  8.5,
    color:     Colors.heroInkMuted,
    height:    13,
  },
  name: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '500',
    color:         Colors.ink1,
    lineHeight:    17,
    height:        34,
    marginTop:     2,
    letterSpacing: -0.1,
  },
  priceBlock: {
    marginTop: 6,
    height:    38,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Space[1] + 1,
  },
  price: {
    fontFamily:    FontFamily.sans,
    fontSize:      13,
    fontWeight:    '700',
    color:         Colors.ink1,
    letterSpacing: -0.2,
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
    marginTop:          3,
  },
});

export default ProductCard;
