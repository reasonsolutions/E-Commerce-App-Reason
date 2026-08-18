import { SortBy } from '../config/enum_files/SortBy';
import type { ProductByCategoryProductDetails } from '../api/interfaces';
import type { SortKey } from '../components/ui';

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

// All sort keys (price_asc/price_desc/newest) are resolved server-side via
// SortBy — see buildPayload in ResultScreen. No client-side re-sort of
// allProducts: the list is rendered in server order across pages.
export function toServerSortBy(sortKey: SortKey): SortBy | null {
  if (sortKey === 'price_asc')  return SortBy.LowToHigh;
  if (sortKey === 'price_desc') return SortBy.HighToLow;
  if (sortKey === 'newest')     return SortBy.Newest;
  return null;
}
