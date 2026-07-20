export enum RefundMode {
  OriginalPaymentSource  = 1,
  PlatformWalletCredit   = 2,
  CouponVoucher          = 3,
}

export const RefundModeLabel: Record<RefundMode, string> = {
  [RefundMode.OriginalPaymentSource]: 'Original Payment Source',
  [RefundMode.PlatformWalletCredit]:  'Platform Wallet Credit',
  [RefundMode.CouponVoucher]:         'Coupon Voucher',
};
