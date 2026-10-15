import { z } from 'zod';
import { zonedToEpoch } from './whatsappDemo.zone';

/**
 * The AI parse's prompt, the shape its answer must have, and the zoned time arithmetic that
 * turns the model's local dates into the epoch milliseconds the chat engine formats.
 */

export interface ParseIntent {
  id: string;
  description: string;
}

export interface ParseEntity {
  name: string;
  kind: string;
  description: string;
}

/** Entity kinds that also get a `<name>Ms` epoch value. */
const TIMED_KINDS: ReadonlySet<string> = new Set(['date', 'time', 'datetime']);

export const SYSTEM_PROMPT = [
  'You read one chat message a customer sent to a business on WhatsApp and return JSON only.',
  'The message may be English, Hindi or Hinglish (Hindi in Latin letters, e.g. "kal shaam 5 baje 4 log" means tomorrow at 5 pm, 4 people; "mera naam Rahul hai" means my name is Rahul).',
  'Return exactly: {"intent": <one of the given intent ids, or null>, "entities": {<entity name>: <value as a short readable string>}, "datetimes": {<entity name>: <local date-time>}}.',
  'Only use the intent ids and entity names you are given; leave out any entity the message does not contain. Never invent values.',
  'Write values readably: names in Title Case, numbers as digits, dates like "Sat, 5 Oct", times like "5:00 PM", date-times like "Sat, 5 Oct, 5:00 PM".',
  'For every entity of kind date, time or datetime also put its value in "datetimes" as YYYY-MM-DDTHH:mm in the given timezone (use 00:00 for a date, today for a time), resolving relative words (today, tomorrow, kal, parso, next Monday, shaam = evening) against the given current local time.',
].join('\n');

export function userPrompt(
  text: string,
  intents: readonly ParseIntent[],
  entities: readonly ParseEntity[],
  now: string,
  timezone: string,
): string {
  return JSON.stringify({ now, timezone, intents, entities, message: text });
}

export const answerSchema = z.object({
  intent: z.string().nullable().optional(),
  entities: z.record(z.string(), z.unknown()).optional(),
  datetimes: z.record(z.string(), z.unknown()).optional(),
});
export type ParseAnswer = z.infer<typeof answerSchema>;

/**
 * The answer reduced to what was asked for: an allowed intent id or null, and string values
 * for the allowed entity names, with `<name>Ms` beside each readable date or time.
 */
export function pickAnswer(
  answer: ParseAnswer,
  intents: readonly ParseIntent[],
  entities: readonly ParseEntity[],
  timeZone: string,
): { intent: string | null; entities: Record<string, string> } {
  const intentIds = new Set(intents.map((intent) => intent.id));
  const intent = answer.intent && intentIds.has(answer.intent) ? answer.intent : null;
  const values: Record<string, string> = {};
  for (const entity of entities) {
    const raw = answer.entities?.[entity.name];
    if ((typeof raw === 'string' || typeof raw === 'number') && String(raw).trim() !== '') {
      values[entity.name] = String(raw).trim().slice(0, 200);
      const local = answer.datetimes?.[entity.name];
      const epoch =
        TIMED_KINDS.has(entity.kind) && typeof local === 'string'
          ? zonedToEpoch(local, timeZone)
          : null;
      if (epoch !== null) {
        values[`${entity.name}Ms`] = String(epoch);
      }
    }
  }
  return { intent, entities: values };
}
