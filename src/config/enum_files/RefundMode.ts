export enum RefundMode {
  OriginalPaymentSource  = 1,
  PlatformWalletCredit   = 2,
  CouponVoucher          = 3,
  // Cash on Delivery — nothing was paid upfront, so no refund method applies.
  NO_REFUND              = 4,
}

export const RefundModeLabel: Record<RefundMode, string> = {
  [RefundMode.OriginalPaymentSource]: 'Original Payment Source',
  [RefundMode.PlatformWalletCredit]:  'Platform Wallet Credit',
  [RefundMode.CouponVoucher]:         'Coupon Voucher',
  [RefundMode.NO_REFUND]:             'Not Applicable',
};
