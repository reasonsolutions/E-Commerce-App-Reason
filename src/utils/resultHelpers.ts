import { SortBy } from '../config/enum_files/SortBy';
import type { ProductByCategoryProductDetails } from '../api/interfaces';
import type { SortKey } from '../components/ui';
import { parseServerDate } from './parseServerDate';

export function deduplicateProducts(
  products: ProductByCategoryProductDetails[],
): ProductByCategoryProductDetails[] {
  const seen = new Set<number>();
  return products.filter(p => {
    if (seen.has(p.Item_Id)) return false;
    seen.add(p.Item_Id);
    return true;
  });
}

export function isFeaturedSpan(indexInGrid: number): boolean {
  return indexInGrid > 0 && indexInGrid % 5 === 0;
}

export function toServerSortBy(sortKey: SortKey): SortBy | null {
  if (sortKey === 'price_asc')  return SortBy.LowToHigh;
  if (sortKey === 'price_desc') return SortBy.HighToLow;
  return null;
}

export function applySort(
  products: ProductByCategoryProductDetails[],
  sortKey: SortKey,
): ProductByCategoryProductDetails[] {
  if (sortKey === 'newest') {
    return [...products].sort((a, b) =>
      parseServerDate(b.Date_Created) - parseServerDate(a.Date_Created),
    );
  }
  return products;
}
