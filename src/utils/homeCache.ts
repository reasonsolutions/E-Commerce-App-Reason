import type { CategoryInterface, GetBrandItem } from '../api/interfaces';

// Written by HomeScreen when API data lands. Read by SearchScreen for FTU chips.
export const homeCache: {
  categories: CategoryInterface[] | null;
  brands:     GetBrandItem[]      | null;
} = { categories: null, brands: null };

export function clearHomeCache(): void {
  homeCache.categories = null;
  homeCache.brands = null;
}
