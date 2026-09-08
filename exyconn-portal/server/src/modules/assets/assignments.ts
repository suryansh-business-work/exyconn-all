import { AssetAssignmentModel } from './assignment.model';

/** The asset fields an assignment transition reads. */
export interface AssetHolder {
  assetTag: string;
  status: string;
  assignedToId: string;
  assignedToName: string;
}

/** The status that means somebody is holding the asset. Anything else closes the row. */
const ASSIGNED = 'ASSIGNED';

/** Whoever is holding the asset now, according to its fields, or '' when nobody is. */
export function holderOf(asset: Pick<AssetHolder, 'status' | 'assignedToId'>): string {
  return asset.status === ASSIGNED ? asset.assignedToId : '';
}

/** The open row for an asset, if there is one. There is never more than one. */
export function openAssignment(assetId: string) {
  return AssetAssignmentModel.findOne({ assetId, returnedAt: null }).lean();
}

/**
 * Brings the assignment history in line with what the asset now says.
 *
 * Called after every write, so the history follows from the asset record rather than from
 * whichever screen made the change. Three cases, in one place:
 *
 *  - the holder is the same as the open row's — nothing to do;
 *  - the holder changed or the asset stopped being ASSIGNED — close the open row;
 *  - somebody now holds it — open a row for them.
 *
 * An employee leaving is the second case: their status moves off ASSIGNED (or the asset is
 * reassigned) and their row is closed with a `returnedAt`, never left open.
 */
export async function syncAssignment(
  assetId: string,
  asset: AssetHolder,
  actorName: string,
  now: Date = new Date(),
): Promise<void> {
  const holder = holderOf(asset);
  const open = await openAssignment(assetId);

  if (open?.employeeId === holder) {
    return;
  }
  if (open) {
    await AssetAssignmentModel.updateOne({ _id: open._id }, { returnedAt: now });
  }
  if (holder === '') {
    return;
  }
  await AssetAssignmentModel.create({
    assetId,
    assetTag: asset.assetTag,
    employeeId: holder,
    employeeName: asset.assignedToName,
    assignedAt: now,
    assignedByName: actorName,
  });
}

/** Every spell this asset has been held for, most recent first. */
export function assignmentsFor(assetId: string) {
  return AssetAssignmentModel.find({ assetId }).sort({ assignedAt: -1 }).lean();
}
