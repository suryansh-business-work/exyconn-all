import { CLOSED_DEAL_STAGES, DealModel } from './deal.model';

/**
 * Gives every deal closed before `closedAt` was kept a close date. Its last change is the best
 * record there is of when it was won or lost; from here on the stage hooks stamp the real one.
 */
export async function backfillDealClosedAt(): Promise<void> {
  await DealModel.updateMany(
    {
      stage: { $in: [...CLOSED_DEAL_STAGES] },
      $or: [{ closedAt: { $exists: false } }, { closedAt: null }],
    },
    [{ $set: { closedAt: '$updatedAt' } }],
  );
}
