import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ProductInterface } from '../../api/interfaces';
import { Colors, Space, Radius } from '../../theme';
import { SectionHead } from './SectionHead';
import { Skeleton, SkeletonRow } from './Skeleton';
import ProductCard from '../ProductCard';

interface ProductRailProps {
  eyebrow?: string;
  title: string;
  items: ProductInterface[] | null;
  cardWidth?: number;
  onSeeAll?: () => void;
  actionLabel?: string;
  onPress: (itemId: number) => void;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  eyebrow,
  title,
  items,
  cardWidth = 158,
  onSeeAll,
  actionLabel = 'See all',
  onPress,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: ProductInterface }) => (
      <ProductCard
        product={item}
        cardWidth={cardWidth}
        onPress={() => onPress(item.ItemID)}
      />
    ),
    [cardWidth, onPress],
  );

  return (
    <View style={styles.wrap}>
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        action={onSeeAll ? actionLabel : undefined}
        onAction={onSeeAll}
      />
      {items === null ? (
        <SkeletonRow gap={Space[4]} style={styles.rail}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <Skeleton height={cardWidth * 1.25} radius={Radius.md} style={{ marginBottom: Space[2] }} />
              <Skeleton height={9}  width="50%" style={{ marginBottom: 4 }} />
              <Skeleton height={12} width="76%" style={{ marginBottom: 4 }} />
              <Skeleton height={12} width="40%" />
            </View>
          ))}
        </SkeletonRow>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.ItemID)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.rail, { gap: Space[4] }]}
          snapToInterval={cardWidth + Space[4]}
          decelerationRate="fast"
          removeClippedSubviews
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: Space[8],
  },
  rail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    alignItems:        'flex-start',
  },
});
