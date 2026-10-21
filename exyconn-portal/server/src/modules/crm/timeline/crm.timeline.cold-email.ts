import type { Types } from 'mongoose';
import { ColdEmailDraftModel } from '../cold-email/cold-email.model';

/** The subject the cold-email service logs its "drafted" activity under (cold-email.service.ts). */
const DRAFTED_SUBJECT = 'Cold email drafted';

interface LoggedActivity {
  _id: Types.ObjectId;
  subject: string;
  notes: string;
  relatedId: string;
}

/**
 * Each "Cold email drafted" activity's draft page, keyed by activity id. The activity does not
 * store the draft's id, so a draft is matched by its record and the line the activity logged
 * ("To <address>: <first subject>"). A deleted draft has no match and its entry stays unlinked.
 */
export async function coldEmailDraftPaths(rows: LoggedActivity[]): Promise<Map<string, string>> {
  const drafted = rows.filter((row) => row.subject === DRAFTED_SUBJECT);
  if (drafted.length === 0) return new Map();
  const drafts = await ColdEmailDraftModel.find({
    recordId: { $in: [...new Set(drafted.map((row) => row.relatedId))] },
  })
    .select('recordId toEmail variants.subject')
    .lean();
  const draftByLine = new Map(
    drafts.map((draft) => [
      `${draft.recordId}|To ${draft.toEmail}: ${draft.variants[0]?.subject ?? ''}`,
      draft._id.toHexString(),
    ]),
  );
  const paths = new Map<string, string>();
  for (const row of drafted) {
    const draftId = draftByLine.get(`${row.relatedId}|${row.notes}`);
    if (draftId) paths.set(row._id.toHexString(), `/cold-emails/${draftId}`);
  }
  return paths;
}
