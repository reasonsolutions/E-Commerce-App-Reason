export enum CustomerCancellationReason {
  ChangedMind               = 1,
  OrderedByMistake          = 2,
  DuplicateOrder            = 3,
  WrongItemOrdered          = 4,
  WrongQuantityOrdered      = 5,
  WrongAddressEntered       = 6,
  FoundBetterPrice          = 7,
  PaymentIssue              = 8,
  CouponNotApplied          = 9,
  DeliveryTooLong           = 10,
  DeliveryNotAvailable      = 11,
  FoundProductDetailsIncorrect = 12,
}

export const CancellationReasonLabel: Record<CustomerCancellationReason, string> = {
  [CustomerCancellationReason.ChangedMind]:                'Changed Mind',
  [CustomerCancellationReason.OrderedByMistake]:           'Ordered By Mistake',
  [CustomerCancellationReason.DuplicateOrder]:             'Duplicate Order',
  [CustomerCancellationReason.WrongItemOrdered]:           'Wrong Item Ordered',
  [CustomerCancellationReason.WrongQuantityOrdered]:       'Wrong Quantity Ordered',
  [CustomerCancellationReason.WrongAddressEntered]:        'Wrong Address Entered',
  [CustomerCancellationReason.FoundBetterPrice]:           'Found Better Price',
  [CustomerCancellationReason.PaymentIssue]:               'Payment Issue',
  [CustomerCancellationReason.CouponNotApplied]:           'Coupon Not Applied',
  [CustomerCancellationReason.DeliveryTooLong]:            'Delivery Too Long',
  [CustomerCancellationReason.DeliveryNotAvailable]:       'Delivery Not Available',
  [CustomerCancellationReason.FoundProductDetailsIncorrect]: 'Found Product Details Incorrect',
};
