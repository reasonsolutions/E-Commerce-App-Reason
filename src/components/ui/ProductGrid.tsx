import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProductInterface } from '../../api/interfaces';
import { Space, Radius } from '../../theme';
import { SectionHead } from './SectionHead';
import { Skeleton } from './Skeleton';
import ProductCard from '../ProductCard';
import { COL_W, GRID_IMG_H } from '../../screens/ResultScreen.styles';

interface ProductGridProps {
  eyebrow?: string;
  title: string;
  items: ProductInterface[] | null;
  onSeeAll?: () => void;
  actionLabel?: string;
  onPress: (itemId: number) => void;
  maxItems?: number;
  wishlistMap?: Map<number, number>;
}

// Large/small card widths — same total row width as two equal COL_W cards,
// just redistributed so one card reads as the visual lead in that row.
const ROW_W   = COL_W * 2 + Space[3];
const LARGE_W = ROW_W * 0.62 - Space[3] / 2;
const SMALL_W = ROW_W * 0.38 - Space[3] / 2;

type GridRow =
  | { type: 'pair'; left: ProductInterface; right?: ProductInterface }
  | { type: 'lead'; large: ProductInterface; small?: ProductInterface };

// Every 3rd row becomes a large/small pair instead of two equal cards — the
// large slot picked by highest real discount in that pair, a real
// merchandising signal rather than an arbitrary position.
function buildRows(items: ProductInterface[]): GridRow[] {
  const rows: GridRow[] = [];
  let i = 0;
  let rowCount = 0;
  while (i < items.length) {
    const isLeadRow = rowCount > 0 && rowCount % 3 === 0;
    const a = items[i];
    const b = items[i + 1];
    if (isLeadRow && b) {
      const [large, small] = a.DiscountPct >= b.DiscountPct ? [a, b] : [b, a];
      rows.push({ type: 'lead', large, small });
    } else {
      rows.push({ type: 'pair', left: a, right: b });
    }
    i += b ? 2 : 1;
    rowCount += 1;
  }
  return rows;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  eyebrow,
  title,
  items,
  onSeeAll,
  actionLabel = 'See all',
  onPress,
  maxItems = 6,
  wishlistMap,
}) => {
  const handlePress = useCallback((itemId: number) => onPress(itemId), [onPress]);
  const visible = items ? items.slice(0, maxItems) : null;
  const rows = useMemo(() => (visible ? buildRows(visible) : null), [visible]);

  return (
    <View style={styles.wrap}>
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        action={onSeeAll ? actionLabel : undefined}
        onAction={onSeeAll}
      />
      {rows === null ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: COL_W, marginBottom: Space[5] }}>
              <Skeleton height={GRID_IMG_H} radius={Radius.md} style={{ marginBottom: Space[2] }} />
              <Skeleton height={9}  width="50%" style={{ marginBottom: 4 }} />
              <Skeleton height={12} width="76%" style={{ marginBottom: 4 }} />
              <Skeleton height={12} width="40%" />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.grid}>
          {rows.map((row) => (
            row.type === 'lead' ? (
              <React.Fragment key={`lead-${row.large.ItemID}`}>
                <View style={{ width: LARGE_W, marginBottom: Space[5] }}>
                  <ProductCard
                    product={row.large}
                    cardWidth={LARGE_W}
                    showDelivery={false}
                    onPress={() => handlePress(row.large.ItemID)}
                    wishlistCode={row.large.Inventory_Id != null ? (wishlistMap?.get(row.large.Inventory_Id) ?? null) : null}
                  />
                </View>
                {row.small && (
                  <View style={{ width: SMALL_W, marginBottom: Space[5] }}>
                    <ProductCard
                      product={row.small}
                      cardWidth={SMALL_W}
                      showDelivery={false}
                      onPress={() => handlePress(row.small!.ItemID)}
                      wishlistCode={row.small.Inventory_Id != null ? (wishlistMap?.get(row.small.Inventory_Id) ?? null) : null}
                    />
                  </View>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key={`pair-${row.left.ItemID}`}>
                <View style={{ width: COL_W, marginBottom: Space[5] }}>
                  <ProductCard
                    product={row.left}
                    cardWidth={COL_W}
                    showDelivery={false}
                    onPress={() => handlePress(row.left.ItemID)}
                    wishlistCode={row.left.Inventory_Id != null ? (wishlistMap?.get(row.left.Inventory_Id) ?? null) : null}
                  />
                </View>
                {row.right && (
                  <View style={{ width: COL_W, marginBottom: Space[5] }}>
                    <ProductCard
                      product={row.right}
                      cardWidth={COL_W}
                      showDelivery={false}
                      onPress={() => handlePress(row.right!.ItemID)}
                      wishlistCode={row.right.Inventory_Id != null ? (wishlistMap?.get(row.right.Inventory_Id) ?? null) : null}
                    />
                  </View>
                )}
              </React.Fragment>
            )
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  grid: {
    flexDirection:     'row',
    flexWrap:          'wrap',
    justifyContent:    'space-between',
    paddingHorizontal: Space.screenH,
  },
});
