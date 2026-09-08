import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient } from '../../utils/openai';
import { logger } from '../../utils/logger';
import { endonymOf } from './locale.constants';

/**
 * How many strings go into one request. Large enough that a screenful of misses is a single
 * round-trip, small enough that one unparseable answer never costs a whole page's worth.
 */
export const TRANSLATE_BATCH = 50;

/**
 * What the model is told. Strict on purpose: it is translating UI chrome, not writing prose,
 * and a "helpful" rewording of a button label is a bug the admin then has to hunt down.
 */
function promptFor(locale: string, sources: string[]): string {
  const language = endonymOf(locale);
  const numbered = sources.map((text, index) => `${index + 1}. ${text}`).join('\n');
  return [
    `Translate these ${sources.length} user-interface strings from English into ${language} (${locale}).`,
    '',
    'Rules:',
    '- Answer with a JSON array of strings and nothing else — no prose, no code fence.',
    '- The array must have exactly one entry per numbered input, in the same order.',
    '- Keep any {placeholder} tokens, HTML tags and trailing punctuation exactly as they are.',
    '- Translate product and company names never; translate everything else.',
    '- These are buttons, labels and short messages: keep them short and in the same register.',
    '',
    numbered,
  ].join('\n');
}

/**
 * Reads the model's answer back as one translation per source.
 *
 * A reply of the wrong length is discarded whole rather than zipped up as far as it goes:
 * a shifted array silently puts the label for "Delete" on the "Save" button, which is far
 * worse than leaving the strings untranslated for another attempt.
 */
export function parseTranslations(reply: string, expected: number): string[] | null {
  const start = reply.indexOf('[');
  const end = reply.lastIndexOf(']');
  if (start < 0 || end <= start) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(reply.slice(start, end + 1));
    if (!Array.isArray(parsed) || parsed.length !== expected) {
      return null;
    }
    if (!parsed.every((entry) => typeof entry === 'string' && entry.trim() !== '')) {
      return null;
    }
    return parsed as string[];
  } catch {
    return null;
  }
}

export interface MachineTranslation {
  source: string;
  text: string;
  model: string;
}

/**
 * Machine-translates a batch of UI strings.
 *
 * Returns an empty list rather than throwing when there is no OpenAI key or the reply cannot
 * be read: a workspace with no key configured must still render — in English — and a missing
 * translation is a thing to retry, never a reason to fail the page that asked for it.
 */
export async function machineTranslate(
  locale: string,
  sources: string[],
): Promise<MachineTranslation[]> {
  if (sources.length === 0) {
    return [];
  }
  const config = await OpenAiConfigModel.findOne({ isActive: true }).lean();
  if (!config) {
    logger.warn({ locale }, 'No active OpenAI key — leaving these strings untranslated');
    return [];
  }

  const batch = sources.slice(0, TRANSLATE_BATCH);
  try {
    const result = await openAiClient.complete({
      apiKey: config.apiKey,
      model: config.defaultModel,
      prompt: promptFor(locale, batch),
    });
    const translated = parseTranslations(result.text, batch.length);
    if (!translated) {
      logger.warn({ locale, count: batch.length }, 'Unreadable translation reply — discarded');
      return [];
    }
    return batch.map((source, index) => ({
      source,
      text: translated[index],
      model: config.defaultModel,
    }));
  } catch (err) {
    logger.error({ err, locale }, 'Machine translation failed');
    return [];
  }
}
