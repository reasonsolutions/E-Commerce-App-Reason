export enum CustomerCancellationReason {
  DamagedItem = 1,
  WrongItem = 2,
  NotAsDescribed = 3,
  MissingParts = 4,
  ChangedMind = 5,
  Other = 6,
}

export const CancellationReasonLabel: Record<
  CustomerCancellationReason,
  string
> = {
  [CustomerCancellationReason.DamagedItem]: 'Item arrived damaged',
  [CustomerCancellationReason.WrongItem]: 'Wrong item delivered',
  [CustomerCancellationReason.NotAsDescribed]: 'Item not as described',
  [CustomerCancellationReason.MissingParts]:
    'Item missing parts or accessories',
  [CustomerCancellationReason.ChangedMind]: 'Changed my mind',
  [CustomerCancellationReason.Other]: 'Other',
};
