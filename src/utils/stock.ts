import type { VariantInterface } from '../api/interfaces';
import { InventoryStockFilter } from '../config/enum_files/InventoryStockFilter';

// BackOrderUpdatedBy is nullable on the wire (null when AllowBackOrder is
// false) even though VariantInterface types it as a plain string — widen
// here so this helper accepts any caller's BackOrder shape (e.g. cart items).
type BackOrderInfo = Omit<NonNullable<VariantInterface['BackOrder']>, 'BackOrderUpdatedBy'> & {
  BackOrderUpdatedBy: string | null;
};

// BackOrderLimit === null means unlimited backorder capacity; otherwise
// capacity is exhausted once BackOrderUsedQuantity reaches the limit.
export const hasBackorderCapacity = (backOrder?: BackOrderInfo): boolean => {
  if (!backOrder?.AllowBackOrder) return false;
  if (backOrder.BackOrderLimit == null) return true;
  return backOrder.BackOrderUsedQuantity < backOrder.BackOrderLimit;
};

interface StockCheckVariant {
  StockStatus?: { Value: InventoryStockFilter };
  BackOrder?:   BackOrderInfo;
}

export const isVariantPurchasable = (variant: StockCheckVariant): boolean =>
  variant.StockStatus?.Value !== InventoryStockFilter.OutOfStock || hasBackorderCapacity(variant.BackOrder);

// A product is sold out only when every one of its variants is out of stock
// (and none has backorder capacity) — checking just the first/representative
// variant misreports a product as sold out when only that specific variant
// (e.g. one size) is unavailable while others remain purchasable.
export const isProductSoldOut = (variants?: StockCheckVariant[]): boolean =>
  !!variants && variants.length > 0 && variants.every(v => !isVariantPurchasable(v));

// MaxPerOrder is a merchant-set cap; when they haven't set one (null), the
// real ceiling is however many units are actually in stock — not an
// arbitrary hardcoded number, and not unlimited either.
// Does NOT account for backorder capacity — use effectivePurchaseLimit when
// BackOrder data is available (e.g. a Stock: 0, backorderable item should
// not be clamped to 0 here). Kept for call sites with no BackOrder data.
export const effectiveMaxPerOrder = (maxPerOrder: number | null | undefined, stock: number): number =>
  maxPerOrder ?? stock;

// Remaining backorder capacity: null (or AllowBackOrder false) means none;
// null BackOrderLimit means unlimited (returns Infinity); otherwise the
// difference between the limit and what's already been used.
const remainingBackorderCapacity = (backOrder?: BackOrderInfo): number => {
  if (!backOrder?.AllowBackOrder) return 0;
  if (backOrder.BackOrderLimit == null) return Infinity;
  return Math.max(0, backOrder.BackOrderLimit - backOrder.BackOrderUsedQuantity);
};

// The real ceiling for how many units can be added in one order, accounting
// for every state a variant can be in:
//  - merchant-set MaxPerOrder always wins outright when present
//  - otherwise, in-stock quantity is purchasable up to Stock
//  - otherwise (Stock <= 0), remaining backorder capacity is purchasable
//    (0 if backorder isn't allowed, Infinity if the merchant set no limit)
// stock/backOrder may be omitted for callers that never captured them (e.g.
// legacy guest-cart entries) — in that case there is nothing reliable to
// clamp against, so the result is Infinity (don't clamp) rather than a guess.
export const effectivePurchaseLimit = (
  maxPerOrder: number | null | undefined,
  stock: number | null | undefined,
  backOrder?: BackOrderInfo,
): number => {
  if (maxPerOrder != null) return maxPerOrder;
  if (stock == null) return Infinity;
  if (stock > 0) return stock;
  return remainingBackorderCapacity(backOrder);
};
