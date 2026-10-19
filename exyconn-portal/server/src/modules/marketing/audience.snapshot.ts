import { AudienceSnapshotEmailModel, AudienceSnapshotRecordModel } from './audience-snapshot.model';
import { resolveLive, type AudienceShape } from './audience.resolve';
import type { RecordSet } from './audience.records';

const recordRows = (audienceId: string, set: RecordSet) =>
  [...set.contacts, ...set.companies, ...set.clients].map((record) => ({
    audienceId,
    kind: record.kind,
    recordId: record.id,
    via: record.via,
  }));

/** Everything freezing writes, worked out before anything is cleared. */
async function snapshotRows(audienceId: string, shape: AudienceShape) {
  const { set, resolution } = await resolveLive(shape);
  if (shape.updateMode === 'FIXED_RECORDS') {
    return { records: recordRows(audienceId, set), emails: [] };
  }
  const emails = resolution.recipients
    .filter((recipient) => recipient.exclusion === null)
    .map(({ email, label, company, sources }) => ({ audienceId, email, label, company, sources }));
  return { records: [], emails };
}

/**
 * Takes a fixed audience's snapshot again, or drops it for a dynamic one, and returns when
 * it was taken (null for dynamic).
 *
 * Saving a fixed audience is what freezes it: the counts the marketer confirmed in the form
 * are the list it keeps. Only addresses that could be sent to then are frozen; each send
 * still re-checks them against today's suppression list and verifier results.
 */
export async function refreshSnapshot(
  audienceId: string,
  shape: AudienceShape,
): Promise<Date | null> {
  const rows = shape.updateMode === 'DYNAMIC' ? null : await snapshotRows(audienceId, shape);
  await dropSnapshot(audienceId);
  if (!rows) {
    return null;
  }
  await Promise.all([
    AudienceSnapshotEmailModel.insertMany(rows.emails),
    AudienceSnapshotRecordModel.insertMany(rows.records),
  ]);
  return new Date();
}

/** Drops whatever a deleted audience had frozen. */
export async function dropSnapshot(audienceId: string): Promise<void> {
  await Promise.all([
    AudienceSnapshotEmailModel.deleteMany({ audienceId }),
    AudienceSnapshotRecordModel.deleteMany({ audienceId }),
  ]);
}
