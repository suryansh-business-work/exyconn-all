import { AiJobModel } from './ai.model';
import { assertWithinAiBudget } from './ai.budget';
import { defaultAiModel, runAiJobNow, type AiActor } from './ai.service';
import { badRequest } from '../../utils/errors';

export const SUMMARY_STYLES = ['BRIEF', 'BULLETS', 'DETAILED'] as const;
export type SummaryStyle = (typeof SUMMARY_STYLES)[number];

export const AI_DRAFT_KINDS = [
  'JOB_DESCRIPTION',
  'EMAIL_REPLY',
  'RELEASE_NOTE',
  'MEETING_NOTES',
] as const;
export type AiDraftKind = (typeof AI_DRAFT_KINDS)[number];

/** How much, and in what shape, a summary comes back. Configuration, not business data. */
const STYLE_INSTRUCTION: Record<SummaryStyle, string> = {
  BRIEF: 'Summarise it in two or three plain sentences.',
  BULLETS: 'Summarise it as at most six short bullet points, one fact each.',
  DETAILED: 'Summarise it thoroughly, keeping every decision, number and name.',
};

/** What each draft kind asks for. Adding a kind is this map plus the GraphQL enum. */
const DRAFT_INSTRUCTION: Record<AiDraftKind, string> = {
  JOB_DESCRIPTION:
    'Write a job description with a short intro, responsibilities and requirements as bullet lists.',
  EMAIL_REPLY: 'Write a polite, direct email reply. No subject line, no placeholder names.',
  RELEASE_NOTE: 'Write release notes as short bullets, grouped into Added, Changed and Fixed.',
  MEETING_NOTES:
    'Write meeting notes with a short summary, the decisions taken and the action items with owners.',
};

/** The job name each kind lands in the AI history under. */
const DRAFT_LABEL: Record<AiDraftKind, string> = {
  JOB_DESCRIPTION: 'Draft job description',
  EMAIL_REPLY: 'Draft email reply',
  RELEASE_NOTE: 'Draft release note',
  MEETING_NOTES: 'Draft meeting notes',
};

/** Longest input either action accepts, so one paste cannot spend the month's budget. */
const MAX_INPUT_CHARS = 20_000;

function assertText(value: string, label: string): string {
  const text = value.trim();
  if (!text) {
    badRequest(`${label} cannot be empty`);
  }
  if (text.length > MAX_INPUT_CHARS) {
    badRequest(`${label} must be at most ${MAX_INPUT_CHARS.toLocaleString()} characters`);
  }
  return text;
}

/**
 * Runs one throwaway prompt and hands back the answer.
 *
 * It still creates an AiJob: an assist run costs the same money as a job somebody typed,
 * so it belongs in the same history, under the same budget, attributed to the same person.
 * Synchronous because the caller is waiting on the text — the queue exists for the jobs
 * grid, where nobody is.
 */
async function runAssist(name: string, prompt: string, actor: AiActor): Promise<string> {
  await assertWithinAiBudget(actor.id);
  const model = await defaultAiModel();
  const job = await AiJobModel.create({
    name,
    model,
    prompt,
    createdById: actor.id,
    createdByName: actor.name,
  });
  const finished = await runAiJobNow(String(job._id));
  if (finished.status === 'FAILED') {
    badRequest(finished.error);
  }
  return finished.response;
}

/** Condenses text a caller already has. Reusable by any module that holds long prose. */
export function aiSummarise(text: string, style: SummaryStyle, actor: AiActor): Promise<string> {
  const body = assertText(text, 'The text to summarise');
  const prompt = `${STYLE_INSTRUCTION[style]}\n\nText:\n${body}`;
  return runAssist(`Summarise (${style.toLowerCase()})`, prompt, actor);
}

/** Writes a first draft of one of a fixed set of documents from the caller's context. */
export function aiDraft(kind: AiDraftKind, context: string, actor: AiActor): Promise<string> {
  const body = assertText(context, 'The context to draft from');
  const prompt = `${DRAFT_INSTRUCTION[kind]}\n\nContext:\n${body}`;
  return runAssist(DRAFT_LABEL[kind], prompt, actor);
}
