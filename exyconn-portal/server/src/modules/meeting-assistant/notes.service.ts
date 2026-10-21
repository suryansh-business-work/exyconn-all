import { badRequest, notFound } from '../../utils/errors';
import { MaNotesModel, type MaNotesContent } from './models';
import { MAX_REVISIONS } from './analysis.persist';
import type { MaActor } from './ma.access';

const LIST_FIELDS = [
  'agenda',
  'discussionPoints',
  'risks',
  'blockers',
  'openQuestions',
  'followUps',
  'nextTopics',
] as const;

/** Trimmed text, blank list entries dropped, sizes capped like the model's own output. */
export function cleanContent(content: MaNotesContent): MaNotesContent {
  const lists = Object.fromEntries(
    LIST_FIELDS.map((field) => [
      field,
      content[field]
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 40)
        .map((item) => item.slice(0, 1000)),
    ]),
  );
  return {
    ...(lists as Pick<MaNotesContent, (typeof LIST_FIELDS)[number]>),
    overview: content.overview.trim().slice(0, 4000),
    executiveSummary: content.executiveSummary.trim().slice(0, 4000),
  };
}

/**
 * Saves a person's edit as the next version. The update only applies when the stored version
 * is the one they started from, so two people editing at once never overwrite each other.
 */
export async function updateNotes(
  meetingId: string,
  content: MaNotesContent,
  expectedVersion: number,
  actor: MaActor,
) {
  const notes = await MaNotesModel.findOne({ meetingId });
  if (!notes) {
    notFound('Meeting notes');
  }
  if (notes.version !== expectedVersion) {
    badRequest('Someone else changed these notes. Reload them and make your edit again.');
  }
  const revision = {
    version: notes.version,
    byId: actor.id,
    byName: actor.name,
    at: new Date(),
    content: notes.content,
  };
  const saved = await MaNotesModel.findOneAndUpdate(
    { _id: notes._id, version: expectedVersion },
    {
      $set: { content: cleanContent(content), edited: true },
      $inc: { version: 1 },
      $push: { revisions: { $each: [revision], $slice: -MAX_REVISIONS } },
    },
    { new: true },
  ).lean();
  if (!saved) {
    badRequest('Someone else changed these notes. Reload them and make your edit again.');
  }
  return { ...saved, id: String(saved._id) };
}
