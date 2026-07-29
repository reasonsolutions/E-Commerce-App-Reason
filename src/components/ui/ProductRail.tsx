import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ProductInterface } from '../../api/interfaces';
import { Space, Radius } from '../../theme';
import { SectionHead } from './SectionHead';
import { Skeleton, SkeletonRow } from './Skeleton';
import ProductCard from '../ProductCard';

interface ProductRailProps {
  eyebrow?: string;
  title: string;
  note?: string;
  items: ProductInterface[] | null;
  cardWidth?: number;
  onSeeAll?: () => void;
  actionLabel?: string;
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  onPress: (itemId: number) => void;
  showQuickAdd?: boolean;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  eyebrow,
  title,
  note,
  items,
  cardWidth = 158,
  onSeeAll,
  actionLabel = 'See all',
  secondaryAction,
  onSecondaryAction,
  onPress,
  showQuickAdd = false,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: ProductInterface }) => (
      <ProductCard
        product={item}
        cardWidth={cardWidth}
        onPress={() => onPress(item.ItemID)}
        showQuickAdd={showQuickAdd}
      />
    ),
    [cardWidth, onPress, showQuickAdd],
  );

  return (
    <View style={styles.wrap}>
      <SectionHead
        eyebrow={eyebrow}
        title={title}
        note={note}
        action={onSeeAll ? actionLabel : undefined}
        onAction={onSeeAll}
        secondaryAction={secondaryAction}
        onSecondaryAction={onSecondaryAction}
      />
      {items === null ? (
        <SkeletonRow gap={Space[4]} style={styles.rail}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: cardWidth }}>
              <Skeleton height={Math.round(cardWidth * 0.88)} radius={Radius.md} />
              <View style={{ paddingTop: Space[2] }}>
                <Skeleton height={13} width="50%" />
                <Skeleton height={34} width="90%" style={{ marginTop: 2 }} />
                <Skeleton height={38} width="70%" style={{ marginTop: 6 }} />
              </View>
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
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {},
  rail: {
    paddingHorizontal: Space.screenH,
    paddingBottom:     Space[2],
    alignItems:        'flex-start',
  },
});
