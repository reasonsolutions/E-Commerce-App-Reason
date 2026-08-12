import { WarrantyType } from '../config/enum_files/WarrantyType';

const WARRANTY_TYPE_LABELS: Record<WarrantyType, string> = {
  [WarrantyType.Manufacturer]: 'Manufacturer',
  [WarrantyType.Seller]:       'Seller',
  [WarrantyType.Extended]:     'Extended',
};

// API sends WarrantyType as a raw numeric code, sometimes stringified (e.g. "1"),
// rather than a resolved { Value, Description } pair like other enum fields.
export function warrantyTypeLabel(code: number | string | null | undefined): string | null {
  if (code == null) return null;
  return WARRANTY_TYPE_LABELS[Number(code) as WarrantyType] ?? null;
}
