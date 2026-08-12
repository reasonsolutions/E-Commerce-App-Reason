import { PaymentModes } from '../config/enum_files/PaymentModes';

const PAYMENT_MODE_LABELS: Record<PaymentModes, string> = {
  [PaymentModes.Cards]:                  'Card',
  [PaymentModes.BankTransfers]:          'Bank Transfer',
  [PaymentModes.Cheques]:                'Cheque',
  [PaymentModes.GiftCertificates]:       'Gift Certificate',
  [PaymentModes.GiftCards]:              'Gift Card',
  [PaymentModes.CashierVouchers]:        'Cashier Voucher',
  [PaymentModes.CreditNotesRedeemed]:    'Credit Note',
  [PaymentModes.MobileMoneyCollections]: 'Mobile Money',
  [PaymentModes.RedemptionLoyaltyCards]: 'Loyalty Card',
  [PaymentModes.CashOnDelivery]:         'Cash On Delivery',
};

export function paymentModeLabel(code: number | null | undefined): string | null {
  if (code == null) return null;
  return PAYMENT_MODE_LABELS[code as PaymentModes] ?? null;
}
