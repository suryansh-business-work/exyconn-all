import { z } from 'zod';
import type { MaSummaryStyle } from './ma.enums';

/** One transcript line as the model sees it: `[n] hh:mm:ss Speaker: text`. */
export interface PromptLine {
  n: number;
  startMs: number;
  speaker: string;
  text: string;
}

const STYLE_GUIDE: Record<MaSummaryStyle, string> = {
  SHORT: 'Keep every section brief: at most three short bullets each, one-paragraph summary.',
  DETAILED: 'Be thorough: cover every substantive topic with specific facts and numbers said.',
  EXECUTIVE: 'Write for an executive: outcomes, decisions, risks and asks first; skip detail.',
  TECHNICAL: 'Write for engineers: keep technical specifics, systems, versions and trade-offs.',
  SALES: 'Write for a sales team: customer needs, objections, budget, timeline and next steps.',
  CLIENT: 'Write for a client discussion record: requests, commitments by each side, open items.',
  STANDUP: 'Write as a daily stand-up: done, doing next, and blockers, per person where said.',
  PROJECT_REVIEW: 'Write as a project review: progress, milestones, risks, scope and schedule.',
};

/**
 * The rules that keep the notes honest. The model is told, in as many words, never to invent
 * an owner, a deadline, a decision or a commitment, and to cite the lines behind every one.
 */
export function systemPrompt(style: MaSummaryStyle): string {
  return [
    'You turn a meeting transcript into structured meeting notes. Reply with ONE JSON object only.',
    'The transcript may be in English, Hindi or a mix (Hinglish). Write the notes in English,',
    'quoting names and terms as spoken.',
    'Strict rules:',
    '- Use ONLY what the transcript says. Never invent decisions, deadlines, owners, attendees or commitments.',
    '- A decision is something the meeting explicitly agreed. A suggestion or a question is not a decision.',
    '- An action item needs someone to do something. Set "owner" only when the transcript names who will',
    '  do it (the speaker saying "I will" counts: use that speaker label); otherwise null.',
    '- Set "dueDate" (YYYY-MM-DD) only when a date can be worked out from what was said and the meeting',
    '  date given; keep the words used in "dueText". Otherwise both null.',
    '- Every decision and action item cites the line numbers [n] that support it in "evidence".',
    '- If a section has nothing, return an empty list or an empty string. Do not pad.',
    `Style: ${STYLE_GUIDE[style]}`,
    'JSON shape: {"overview": string, "executiveSummary": string, "agenda": string[],',
    '"discussionPoints": string[], "risks": string[], "blockers": string[], "openQuestions": string[],',
    '"followUps": string[], "nextTopics": string[],',
    '"decisions": [{"text": string, "evidence": number[], "confidence": number}],',
    '"actionItems": [{"title": string, "description": string, "owner": string|null,',
    '"dueDate": string|null, "dueText": string|null, "priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",',
    '"evidence": number[], "confidence": number}]}',
    'confidence is 0 to 1: how clearly the transcript supports the item.',
  ].join('\n');
}

const clock = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((part) => String(part).padStart(2, '0')).join(':');
};

export function formatLines(lines: PromptLine[]): string {
  return lines
    .map((line) => `[${line.n}] ${clock(line.startMs)} ${line.speaker}: ${line.text}`)
    .join('\n');
}

export interface PromptContext {
  title: string;
  date: string;
  timezone: string;
  participants: string[];
  part?: { index: number; total: number };
}

export function userPrompt(context: PromptContext, lines: PromptLine[]): string {
  const part = context.part
    ? `\nThis is part ${context.part.index} of ${context.part.total} of the transcript.`
    : '';
  return [
    `Meeting: ${context.title || 'Untitled meeting'}`,
    `Meeting date: ${context.date} (${context.timezone})`,
    `Participants seen in the call: ${context.participants.join(', ') || 'Not specified'}`,
    part,
    'Transcript:',
    formatLines(lines),
  ].join('\n');
}

/** The prompt that folds the notes of several transcript parts into one set of sections. */
export function mergePrompt(partials: unknown[]): string {
  return [
    'These are notes written separately for consecutive parts of ONE meeting.',
    'Combine them into one set of notes with the same JSON shape, removing repetition.',
    'Return "decisions" and "actionItems" as empty lists; they are merged elsewhere.',
    'Do not add anything that is not in these notes.',
    JSON.stringify(partials),
  ].join('\n');
}

const text = z.string().trim().max(4000).catch('');
const list = z.array(z.string().trim().min(1).max(1000)).max(40).catch([]);
const evidence = z.array(z.number().int().nonnegative()).max(20).catch([]);
const confidence = z.number().min(0).max(1).catch(0.5);

export const analysisSchema = z.object({
  overview: text,
  executiveSummary: text,
  agenda: list,
  discussionPoints: list,
  risks: list,
  blockers: list,
  openQuestions: list,
  followUps: list,
  nextTopics: list,
  decisions: z
    .array(z.object({ text: z.string().trim().min(1).max(2000), evidence, confidence }))
    .max(50)
    .catch([]),
  actionItems: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(500),
        description: z.string().trim().max(5000).catch(''),
        owner: z.string().trim().min(1).max(200).nullable().catch(null),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .nullable()
          .catch(null),
        dueText: z.string().trim().max(200).nullable().catch(null),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).catch('MEDIUM'),
        evidence,
        confidence,
      }),
    )
    .max(100)
    .catch([]),
});

export type Analysis = z.infer<typeof analysisSchema>;

/** Parses the model's reply, or null when it is not the JSON asked for. */
export function parseAnalysis(reply: string): Analysis | null {
  try {
    const parsed = analysisSchema.safeParse(JSON.parse(reply));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
