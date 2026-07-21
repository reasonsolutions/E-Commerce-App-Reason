import type { SavedCartItemInterface, PlaceOrderItemDetail } from '../api/interfaces';

export const cartLineNet = (item: SavedCartItemInterface): number =>
  item.Price * item.Quantity;

export const cartLineGross = (item: SavedCartItemInterface): number =>
  (item.PriceDetails?.GrossAmount ?? item.Price) * item.Quantity;

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
  taxRate: number;
  amount: number;
}

// Groups the cart's total tax by rate — e.g. separate "VAT (15%)" lines if a
// cart ever mixes rates, instead of one flattened total. Grouping key and
// summed amount both come straight from the backend (item's own TaxId/TaxRate
// and TaxAmount); items with no active tax entry are skipped, not zero-grouped.
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
      groups.set(tax.TaxId, { taxId: tax.TaxId, taxRate: tax.TaxRate, amount: taxAmount * item.Quantity });
    }
  }
  return Array.from(groups.values());
};

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
  const gross = item.PriceDetails?.GrossAmount ?? item.Price;
  const compare = item.PriceDetails?.ComparePrice;
  if (!compare || compare <= gross) return undefined;
  if (grossExceedsMrp(item)) return undefined;
  return compare;
};

// Builds the ItemDetails[] block shared by AddressScreen's COD payload and
// PaymentScreen's two payload sites (MIPS transData + finaliseOrder).
export const buildOrderItemDetails = (items: SavedCartItemInterface[]): PlaceOrderItemDetail[] =>
  items.map(item => ({
    InventoryId:        item.InventoryId,
    Quantity:           item.Quantity,
    Amount:             item.Price * item.Quantity,
    DeliveryCharges:    0,
    DeliveryChargesVAT: 0,
    ItemCharges:        0,
    ItemChargesVAT:     0,
    Discount:           0,
    VAT:                cartLineTax(item),
    OrderStatus:        1,
    Taxes: (item.PriceDetails?.Taxes ?? []).map(t => ({
      TaxId:   t.TaxId,
      TaxName: '',
      TaxType: t.TaxType,
      TaxRate: t.TaxRate,
      Reason:  '',
    })),
  }));
