import { z } from 'zod';
import type { ColdEmailTone } from './cold-email.model';

/** How each tone is described to the model. Configuration, not business data. */
const TONE_INSTRUCTION: Record<ColdEmailTone, string> = {
  FRIENDLY: 'Warm and conversational, like a helpful peer.',
  FORMAL: 'Polite and professional, without stiffness.',
  BRIEF: 'As short as possible: three or four sentences at most.',
};

export const MAX_SUBJECT_CHARS = 200;
export const MAX_BODY_CHARS = 5000;

/** A bracketed or braced gap the model left for somebody to fill, e.g. "[Name]" or "{{company}}". */
const PLACEHOLDER = /\[[^\]\n]{1,40}\]|\{\{|\}\}/;

const replySchema = z.object({
  subject: z.string().trim().min(1).max(MAX_SUBJECT_CHARS),
  body: z.string().trim().min(1).max(MAX_BODY_CHARS),
});

export type ColdEmailText = z.infer<typeof replySchema>;

/** The answer to a prompt for several versions at once; single items are checked one by one. */
const batchSchema = z.object({ versions: z.array(z.unknown()).min(1) });

/**
 * The angles a batch of versions is spread over, so they are not the same email reworded.
 * Configuration, not business data; a batch uses the first `count` of them.
 */
const ANGLES = [
  'opens with something specific about them from the context',
  'opens with a problem a business like theirs is likely to face',
  'leads with what we are offering and the outcome it brings',
  'is the shortest, built around one simple question',
] as const;

/** The most versions one AI call writes. */
export const MAX_BATCH = ANGLES.length;

export interface ColdEmailPromptInput {
  /** Who and what the record is, and what we know about their business. */
  context: string;
  recipientName: string;
  senderName: string;
  organizationName: string;
  goal: string;
  tone: ColdEmailTone;
  /** What this version should do differently from the earlier ones. */
  instruction: string;
  earlierSubjects: string[];
  /** How many versions to write in this one call, 1 to MAX_BATCH; one when left out. */
  count?: number;
}

function answerFormat(count: number): string[] {
  const one = '{"subject": "...", "body": "..."}';
  if (count === 1) {
    return [`Answer with JSON only, exactly {"versions": [${one}]}, and nothing else.`];
  }
  return [
    `Write ${count} clearly different versions of it. Each version:`,
    ...ANGLES.slice(0, count).map((angle, index) => `- Version ${index + 1} ${angle}.`),
    `Answer with JSON only, exactly {"versions": [${one}, ...]} with ${count} items, and nothing else.`,
  ];
}

/** The prompt for one or more versions of the email; the model answers with JSON only. */
export function coldEmailPrompt(input: ColdEmailPromptInput): string {
  const lines = [
    `Write a cold email from ${input.senderName} at ${input.organizationName} to ${input.recipientName}.`,
    'Rules:',
    '- Personalise it from the business context below; mention something specific about them.',
    "- Speak to the person's role and the company's industry, size and situation where the context gives them.",
    '- Our internal notes, tags, deal stages and lead details are background only: never quote them or say we keep records on them.',
    '- At most 150 words in the body, plain text, paragraphs separated by blank lines.',
    '- One clear call to action.',
    '- No invented facts, numbers, clients or results; use only what the context says.',
    `- No placeholders such as [Name] or {{company}}: use the real names given here, and sign off as ${input.senderName}.`,
    `- Tone: ${TONE_INSTRUCTION[input.tone]}`,
    ...answerFormat(input.count ?? 1),
    '',
    `What we are offering: ${input.goal}`,
  ];
  if (input.instruction) {
    lines.push(`For this version: ${input.instruction}`);
  }
  if (input.earlierSubjects.length > 0) {
    lines.push(
      `Make it clearly different from the earlier versions: ${input.earlierSubjects.join(' | ')}`,
    );
  }
  lines.push('', 'Business context:', input.context);
  return lines.join('\n');
}

/** One version as a subject and body, or null when it is out of bounds or carries a placeholder. */
function parseVersion(raw: unknown): ColdEmailText | null {
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const { subject, body } = parsed.data;
  return PLACEHOLDER.test(subject) || PLACEHOLDER.test(body) ? null : parsed.data;
}

/**
 * The usable versions in the model's answer: an empty list when it is not the JSON asked for;
 * a version that is out of bounds or still carries a placeholder is left out. Code fences
 * around the JSON are tolerated.
 */
export function parseColdEmails(response: string): ColdEmailText[] {
  const start = response.indexOf('{');
  const end = response.lastIndexOf('}');
  if (start < 0 || end <= start) {
    return [];
  }
  let raw: unknown;
  try {
    raw = JSON.parse(response.slice(start, end + 1));
  } catch {
    return [];
  }
  const parsed = batchSchema.safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.versions
    .map(parseVersion)
    .filter((version): version is ColdEmailText => version !== null);
}
