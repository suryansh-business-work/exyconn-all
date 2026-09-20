import { ContractModel } from './legal.model';

/**
 * Marks a contract EXPIRED once its expiry date has passed.
 *
 * EXPIRED has been in the status list since the register was built and nothing ever wrote
 * it: an agreement that ran out last March still read as ACTIVE, which is how a business
 * ends up relying on cover it no longer has. `expiryDate` is required on every contract, so
 * there is never a reason to guess.
 *
 * Only from ACTIVE. A DRAFT that was never signed did not expire — it was abandoned — and a
 * TERMINATED one ended for a reason somebody recorded, which this must not overwrite.
 */
export async function expireLapsedContracts(now = new Date()): Promise<number> {
  const result = await ContractModel.updateMany(
    { status: 'ACTIVE', expiryDate: { $lt: now } },
    { status: 'EXPIRED' },
  );
  return result.modifiedCount;
}
