import type { Types } from 'mongoose';
import { ColdEmailDraftModel, type ColdEmailObject } from '../cold-email/cold-email.model';

/** The subject the cold-email service logs its "drafted" activity under (cold-email.service.ts). */
const DRAFTED_SUBJECT = 'Cold email drafted';

interface LoggedActivity {
  _id: Types.ObjectId;
  subject: string;
  notes: string;
  relatedId: string;
}

/** The record's "Cold emails" tab with the draft opened in place (the CRM portal's address). */
const draftPath = (object: ColdEmailObject, recordId: string, draftId: string) =>
  `/${object === 'CONTACT' ? 'contacts' : 'companies'}/${recordId}/cold-emails?coldEmail=${draftId}`;

/**
 * Each "Cold email drafted" activity's draft, opened on its record's "Cold emails" tab, keyed
 * by activity id. The activity does not store the draft's id, so a draft is matched by its
 * record and the line the activity logged ("To <address>: <first subject>"). A deleted draft
 * has no match and its entry stays unlinked.
 */
export async function coldEmailDraftPaths(rows: LoggedActivity[]): Promise<Map<string, string>> {
  const drafted = rows.filter((row) => row.subject === DRAFTED_SUBJECT);
  if (drafted.length === 0) return new Map();
  const drafts = await ColdEmailDraftModel.find({
    recordId: { $in: [...new Set(drafted.map((row) => row.relatedId))] },
  })
    .select('object recordId toEmail variants.subject')
    .lean();
  const draftByLine = new Map(
    drafts.map((draft) => [
      `${draft.recordId}|To ${draft.toEmail}: ${draft.variants[0]?.subject ?? ''}`,
      draftPath(draft.object, draft.recordId, draft._id.toHexString()),
    ]),
  );
  const paths = new Map<string, string>();
  for (const row of drafted) {
    const path = draftByLine.get(`${row.relatedId}|${row.notes}`);
    if (path) paths.set(row._id.toHexString(), path);
  }
  return paths;
}
