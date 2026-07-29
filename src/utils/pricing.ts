import type { SavedCartItemInterface, CartTaxBreakdownItem } from '../api/interfaces';

export const cartLineNet = (item: SavedCartItemInterface): number =>
  (item.PriceDetails?.Price ?? item.Price) * item.Quantity;

export const cartLineGross = (item: SavedCartItemInterface): number =>
  (item.PriceDetails?.GrossAmount ?? item.PriceDetails?.Price ?? item.Price) * item.Quantity;

// TaxAmount must come directly from the backend — no derived/fallback math.
// If the backend didn't send a tax amount for this line, it contributes 0.
export const cartLineTax = (item: SavedCartItemInterface): number =>
  (item.PriceDetails?.TaxAmount ?? 0) * item.Quantity;

// Single source of truth for discount % — always derived from actual
// price/comparePrice, never trusted from a backend-supplied DiscountPct
// field (those have been seen out of sync with the prices on the same row).
export const discountPct = (price: number, comparePrice: number | null | undefined): number =>
  comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

export interface TaxGroup {
  taxId: number;
  taxName?: string;
  taxRate: number;
  amount: number;
}

// Groups the cart's total tax by rate — e.g. separate "VAT (15%)" lines if a
// cart ever mixes rates, instead of one flattened total. Grouping key and
// summed amount both come straight from the backend (item's own TaxId/TaxRate/
// TaxName and TaxAmount); items with no active tax entry are skipped, not
// zero-grouped.
export const cartTaxBreakdown = (items: SavedCartItemInterface[]): TaxGroup[] => {
  const groups = new Map<number, TaxGroup>();
  for (const item of items) {
    const tax = item.PriceDetails?.Taxes?.[0];
    const taxAmount = item.PriceDetails?.TaxAmount;
    if (!tax || taxAmount == null) continue;
    const existing = groups.get(tax.TaxId);
    if (existing) {
      existing.amount += taxAmount * item.Quantity;
    } else {
      groups.set(tax.TaxId, { taxId: tax.TaxId, taxName: tax.TaxName, taxRate: tax.TaxRate, amount: taxAmount * item.Quantity });
    }
  }
  return Array.from(groups.values());
};

// Backend-authoritative equivalent of cartTaxBreakdown — maps getSaveCartItems'
// root-level TaxBreakdown (already summed across the cart) onto the same
// TaxGroup shape the summary UI renders, so no JSX change is needed at the
// call site when switching from client-derived to backend-derived totals.
export const mapCartTaxBreakdown = (breakdown: CartTaxBreakdownItem[]): TaxGroup[] =>
  breakdown.map(tax => ({ taxId: tax.TaxId, taxName: tax.TaxName, taxRate: tax.TaxRate, amount: tax.TaxAmount }));

// True when the backend's tax-inclusive GrossAmount exceeds the legally
// tax-inclusive MRP (ComparePrice) — a backend data bug, not a client one.
export const grossExceedsMrp = (item: SavedCartItemInterface): boolean => {
  const gross = item.PriceDetails?.GrossAmount;
  const compare = item.PriceDetails?.ComparePrice;
  return gross != null && compare != null && gross > compare;
};

// The "was" unit price to show for strikethrough purposes, or undefined if
// showing it would be misleading (no real discount, or MRP violated).
export const cartDisplayWas = (item: SavedCartItemInterface): number | undefined => {
  const gross = item.PriceDetails?.GrossAmount ?? item.PriceDetails?.Price ?? item.Price;
  const compare = item.PriceDetails?.ComparePrice;
  if (!compare || compare <= gross) return undefined;
  if (grossExceedsMrp(item)) return undefined;
  return compare;
};
