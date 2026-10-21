import { createHash } from 'node:crypto';
import { UserModel } from '../admin/user.model';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaNotesModel,
  MaParticipantModel,
  type MaMeetingDocument,
  type MaNotesContent,
} from './models';
import type { Analysis } from './analysis.prompt';
import type { AnalysisRun, SourceLine } from './analysis.service';
import type { MaSummaryStyle } from './ma.enums';

/** Older versions of the notes kept for history. */
export const MAX_REVISIONS = 50;
const MAX_EVIDENCE = 5;
const QUOTE_LENGTH = 300;
/** Who AI-created checklist items are attributed to. */
const AI_AUTHOR = { id: 'system', name: 'Meeting Assistant' };

type LeanMeeting = MaMeetingDocument & { _id: unknown };

/** The same words in the same order are the same item, whatever the case or punctuation. */
export function fingerprint(text: string): string {
  const words =
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  return createHash('sha256').update(words.join(' ')).digest('hex');
}

type Evidence = ReturnType<typeof evidenceFor>;

/** The cited lines that exist, as evidence; an item citing nothing real has no evidence. */
export function evidenceFor(numbers: number[], lines: SourceLine[]) {
  const picked = new Set<number>();
  for (const n of numbers) {
    if (picked.size === MAX_EVIDENCE) {
      break;
    }
    if (Number.isInteger(n) && n >= 0 && n < lines.length) {
      picked.add(n);
    }
  }
  return [...picked].map((n) => ({
    segmentId: lines[n].segmentId,
    quote: lines[n].text.slice(0, QUOTE_LENGTH),
    startMs: lines[n].startMs,
    speakerLabel: lines[n].speakerLabel,
  }));
}

/**
 * An owner the transcript actually names: someone who spoke, was seen in the call, or whose
 * name appears in what was said. Anything else the model offered is dropped, not trusted.
 */
export function groundedOwner(
  owner: string | null,
  lines: SourceLine[],
  people: string[],
): string | null {
  if (!owner) {
    return null;
  }
  const needle = owner.toLowerCase();
  const known =
    people.some((person) => person.toLowerCase() === needle) ||
    lines.some(
      (line) => line.speaker.toLowerCase() === needle || line.text.toLowerCase().includes(needle),
    );
  return known ? owner : null;
}

/** A due date the model gave, if it is a real calendar date. */
export function parsedDue(value: string | null): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

interface Assignee {
  userId: string;
  email: string;
}

/** Owners who are verified portal accounts: the extension user and confirmed speakers. */
async function verifiedAssignees(meeting: LeanMeeting): Promise<Map<string, Assignee>> {
  const known = new Map<string, Assignee>();
  const selves = await MaParticipantModel.find({
    meetingId: String(meeting._id),
    userId: { $ne: null },
  })
    .select('displayName userId email')
    .lean();
  for (const row of selves) {
    if (row.userId && row.email) {
      known.set(row.displayName.toLowerCase(), { userId: row.userId, email: row.email });
    }
  }
  const mapped = meeting.speakerMappings.filter((mapping) => mapping.userId);
  const users = await UserModel.find({ _id: { $in: mapped.map((mapping) => mapping.userId) } })
    .select('email')
    .lean();
  for (const mapping of mapped) {
    const user = users.find((candidate) => String(candidate._id) === mapping.userId);
    if (user) {
      known.set(mapping.name.toLowerCase(), { userId: String(user._id), email: user.email });
    }
  }
  return known;
}

/** The written sections of an analysis; its decisions and actions are saved as their own rows. */
function contentOf(analysis: Analysis): MaNotesContent {
  return {
    overview: analysis.overview,
    executiveSummary: analysis.executiveSummary,
    agenda: analysis.agenda,
    discussionPoints: analysis.discussionPoints,
    risks: analysis.risks,
    blockers: analysis.blockers,
    openQuestions: analysis.openQuestions,
    followUps: analysis.followUps,
    nextTopics: analysis.nextTopics,
  };
}

/** Saves the notes as a new version; the previous one goes into the history. */
export async function saveNotes(meeting: LeanMeeting, run: AnalysisRun, style: MaSummaryStyle) {
  const meetingId = String(meeting._id);
  const content = contentOf(run.analysis);
  const generated = {
    style,
    model: run.model,
    generatedAt: new Date(),
    original: content,
    content,
    edited: false,
    promptTokens: run.usage.promptTokens,
    completionTokens: run.usage.completionTokens,
    costUsd: run.costUsd,
  };
  const existing = await MaNotesModel.findOne({ meetingId });
  if (!existing) {
    return MaNotesModel.create({ meetingId, version: 1, ...generated });
  }
  existing.revisions.push({
    version: existing.version,
    byId: AI_AUTHOR.id,
    byName: AI_AUTHOR.name,
    at: new Date(),
    content: existing.content,
  });
  existing.set({
    ...generated,
    version: existing.version + 1,
    revisions: existing.revisions.slice(-MAX_REVISIONS),
  });
  return existing.save();
}

/** Decisions with real evidence, updated in place on a regenerate (never duplicated). */
export async function saveDecisions(meeting: LeanMeeting, run: AnalysisRun): Promise<void> {
  const meetingId = String(meeting._id);
  // One row per fingerprint: two windows reporting the same decision must not race to insert it.
  const grounded = new Map<
    string,
    { decision: Analysis['decisions'][number]; evidence: Evidence }
  >();
  for (const decision of run.analysis.decisions) {
    const evidence = evidenceFor(decision.evidence, run.lines);
    const key = fingerprint(decision.text);
    if (evidence.length > 0 && !grounded.has(key)) {
      grounded.set(key, { decision, evidence });
    }
  }
  await Promise.all(
    [...grounded].map(([key, { decision, evidence }]) =>
      MaDecisionModel.updateOne(
        { meetingId, fingerprint: key },
        { $set: { text: decision.text, evidence, confidence: decision.confidence } },
        { upsert: true },
      ),
    ),
  );
}

/** The fields a regenerate may refresh — never ones a person edited, never the status. */
const AI_FIELDS: ReadonlySet<string> = new Set([
  'description',
  'assignedTo',
  'assignedUserId',
  'assignedEmail',
  'dueDate',
  'dueText',
  'priority',
]);

function refreshable(fields: Record<string, unknown>, edited: string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).filter(([field]) => !AI_FIELDS.has(field) || !edited.includes(field)),
  );
}

type AiItem = Analysis['actionItems'][number];

interface ItemContext {
  meeting: LeanMeeting;
  run: AnalysisRun;
  people: string[];
  assignees: Map<string, Assignee>;
}

/** The checklist fields for one AI item, or null when it cites no real transcript line. */
function itemFields(item: AiItem, context: ItemContext) {
  const evidence = evidenceFor(item.evidence, context.run.lines);
  if (evidence.length === 0) {
    return null;
  }
  const owner = groundedOwner(item.owner, context.run.lines, context.people);
  const assignee = owner ? context.assignees.get(owner.toLowerCase()) : undefined;
  const dueDate = parsedDue(item.dueDate);
  return {
    description: item.description,
    assignedTo: owner,
    assignedUserId: assignee?.userId ?? null,
    assignedEmail: assignee?.email ?? null,
    dueDate,
    dueText: item.dueText,
    priority: item.priority,
    evidence,
    confidence: item.confidence,
    sourceTimestampMs: evidence[0].startMs,
    needsConfirmation: owner !== null || dueDate !== null || item.dueText !== null,
  };
}

/** Creates the row, or refreshes the one a previous run made — leaving a person's edits alone. */
async function upsertItem(
  item: AiItem,
  fields: NonNullable<ReturnType<typeof itemFields>>,
  meeting: LeanMeeting,
) {
  const key = { meetingId: String(meeting._id), fingerprint: fingerprint(item.title) };
  const existing = await MaActionItemModel.findOne(key).select('editedFields').lean();
  if (existing) {
    await MaActionItemModel.updateOne(key, { $set: refreshable(fields, existing.editedFields) });
    return;
  }
  await MaActionItemModel.create({
    ...key,
    ...fields,
    title: item.title,
    meetingTitle: meeting.title,
    meetingCode: meeting.meetingCode,
    aiGenerated: true,
    viewerIds: meeting.viewerIds,
    createdById: AI_AUTHOR.id,
    createdByName: AI_AUTHOR.name,
  });
}

/**
 * Turns the AI's action items into checklist rows. Items without evidence are dropped; an
 * owner or deadline the transcript does not pin down is left blank, and anything suggested is
 * flagged for a person to confirm. Two items with the same title are one item.
 */
export async function saveActionItems(
  meeting: LeanMeeting,
  run: AnalysisRun,
  people: string[],
): Promise<number> {
  const context: ItemContext = {
    meeting,
    run,
    people,
    assignees: await verifiedAssignees(meeting),
  };
  const unique = new Map<
    string,
    { item: AiItem; fields: NonNullable<ReturnType<typeof itemFields>> }
  >();
  for (const item of run.analysis.actionItems) {
    const fields = itemFields(item, context);
    const key = fingerprint(item.title);
    if (fields && !unique.has(key)) {
      unique.set(key, { item, fields });
    }
  }
  await Promise.all(
    [...unique.values()].map(({ item, fields }) => upsertItem(item, fields, meeting)),
  );
  return unique.size;
}
