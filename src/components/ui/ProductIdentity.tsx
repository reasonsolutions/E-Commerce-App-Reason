import React from 'react';
import { VStack, HStack, Text } from '../primitives';
import { Price } from './Price';
import { Skeleton } from './Skeleton';
import { Space } from '../../theme';
import { Type } from '../../theme/typography';

interface ProductIdentityProps {
  brand?: string | null;
  name: string;
  price: number;
  comparePrice?: number;
  loading?: boolean;
}

// Brand label + serif product name + price row as a single semantic unit.
// Canonical identity block for product surfaces: ProductScreen, cart rows,
// order detail. Encapsulates the Type.label / Type.priceLarge / Price pattern.
export const ProductIdentity: React.FC<ProductIdentityProps> = ({
  brand,
  name,
  price,
  comparePrice,
  loading = false,
}) => {
  if (loading) {
    return (
      <VStack style={{ gap: Space[2] }}>
        <Skeleton height={11} width="22%" />
        <Skeleton height={26} width="78%" />
        <Skeleton height={26} width="55%" />
        <Skeleton height={32} width="36%" />
      </VStack>
    );
  }

  return (
    <VStack style={{ gap: Space[2] }}>
      {brand ? (
        <Text style={Type.label}>{brand}</Text>
      ) : null}
      <Text
        style={[Type.heading, { fontSize: 24, letterSpacing: -0.4, lineHeight: 24 * 1.18 }]}
        numberOfLines={3}
      >
        {name}
      </Text>
      <HStack style={{ gap: Space[2] + 2, alignItems: 'baseline' }}>
        <Price value={price} was={comparePrice} size="large" />
      </HStack>
    </VStack>
  );
};
