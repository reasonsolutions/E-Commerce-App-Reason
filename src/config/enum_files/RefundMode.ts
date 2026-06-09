export enum RefundMode {
  OriginalPaymentSource  = 1,
  McbJuice               = 2,
  MytMoney               = 3,
  EmtelMoney             = 4,
  PlatformWalletCredit   = 5,
  CouponVoucher          = 6,
  BankTransferManual     = 7,
  CashRefund             = 8,
  AdminIssuedCredit      = 9,
}

export const RefundModeLabel: Record<RefundMode, string> = {
  [RefundMode.OriginalPaymentSource]: 'Original Payment Source',
  [RefundMode.McbJuice]:              'MCB Juice',
  [RefundMode.MytMoney]:              'MYT Money',
  [RefundMode.EmtelMoney]:            'Emtel Money',
  [RefundMode.PlatformWalletCredit]:  'Platform Wallet Credit',
  [RefundMode.CouponVoucher]:         'Coupon Voucher',
  [RefundMode.BankTransferManual]:    'Bank Transfer Manual',
  [RefundMode.CashRefund]:            'Cash Refund',
  [RefundMode.AdminIssuedCredit]:     'Admin Issued Credit',
};
