import type { CategoryInterface } from '../api/interfaces';

// Module-level category/brand cache for ResultScreen's filter sheet — fetched
// once per app session. Lives in its own file (rather than inline in
// ResultScreen.tsx) so auth.ts can import clearResultScreenCache() on logout
// without a circular import.
export const resultScreenCache: {
  categories: CategoryInterface[];
  brands:     { id: number; name: string }[];
} = { categories: [], brands: [] };

export function clearResultScreenCache(): void {
  resultScreenCache.categories = [];
  resultScreenCache.brands = [];
}
