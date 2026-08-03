import type { CategoryInterface, ProductInterface, GetBrandItem } from '../api/interfaces';

// Module-level product/category/brand cache for HomeScreen — survives
// remounts within an app session. Lives in its own file (rather than inline
// in HomeScreen.tsx) so auth.ts can import clearHomeScreenCache() on logout
// without a circular import (HomeScreen.tsx already imports clearSession from
// auth.ts).
export const homeScreenCache: {
  products:   ProductInterface[]  | null;
  categories: CategoryInterface[] | null;
  brands:     GetBrandItem[]      | null;
  bestDeals:  ProductInterface[]  | null;
} = { products: null, categories: null, brands: null, bestDeals: null };

export function clearHomeScreenCache(): void {
  homeScreenCache.products = null;
  homeScreenCache.categories = null;
  homeScreenCache.brands = null;
  homeScreenCache.bestDeals = null;
}
