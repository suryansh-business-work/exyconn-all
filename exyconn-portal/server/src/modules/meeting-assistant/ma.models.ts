import { OpenAiConfigModel } from '../tech/openai-config.model';
import { openAiClient } from '../../utils/openai';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest, reasonOf } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { GraphQLContext } from '../../middleware/auth';
import { assertSettingsReader } from './ma.access';

/** What a model is picked for: writing the notes, or turning call audio into text. */
export type MaModelPurpose = 'ANALYSIS' | 'TRANSCRIPTION';

/** How long one OpenAI model list is reused before it is read again. */
const CACHE_MS = 10 * 60 * 1000;

/** Ids that start like a chat model (`gpt-4o`, `o3-mini`, a fine-tune `ft:gpt-4o-mini:…`). */
const CHAT_PREFIXES = ['gpt-', 'chatgpt-', 'o1', 'o3', 'o4', 'ft:gpt-'];

/** Words that mark a model as audio, image, search or embedding work rather than chat. */
const NOT_CHAT = [
  'transcribe',
  'whisper',
  'tts',
  'audio',
  'realtime',
  'image',
  'search',
  'embedding',
  'moderation',
  'instruct',
];

/** Words that mark a speech-to-text model. */
const SPEECH_TO_TEXT = ['transcribe', 'whisper'];

const includesAny = (id: string, words: readonly string[]) =>
  words.some((word) => id.includes(word));

const FITS: Record<MaModelPurpose, (id: string) => boolean> = {
  ANALYSIS: (id) =>
    CHAT_PREFIXES.some((prefix) => id.startsWith(prefix)) && !includesAny(id, NOT_CHAT),
  TRANSCRIPTION: (id) => includesAny(id, SPEECH_TO_TEXT),
};

let cached: { apiKey: string; at: number; models: string[] } | null = null;

/** Every model the platform's OpenAI key can reach, read at most once per CACHE_MS per key. */
async function platformModels(): Promise<string[]> {
  const config = await runAsPlatform(() => OpenAiConfigModel.findOne({ isActive: true }).lean());
  if (!config) {
    badRequest(
      'OpenAI is not configured (Tech > Environment Variables > OpenAI), so no models can be listed.',
    );
  }
  if (cached?.apiKey === config.apiKey && Date.now() - cached.at < CACHE_MS) {
    return cached.models;
  }
  try {
    const models = await openAiClient.listModels(config.apiKey);
    cached = { apiKey: config.apiKey, at: Date.now(), models };
    return models;
  } catch (err) {
    logger.warn({ reason: reasonOf(err) }, 'Meeting Assistant could not list the OpenAI models');
    badRequest(
      'OpenAI did not return its model list. Check the key in Tech > Environment Variables.',
    );
  }
}

export const maModelQueries = {
  /** The models the settings form offers for one purpose, sorted; any other name may be typed. */
  maAvailableModels: async (
    _p: unknown,
    { purpose }: { purpose: MaModelPurpose },
    ctx: GraphQLContext,
  ) => {
    await assertSettingsReader(ctx);
    const models = await platformModels();
    return models.filter(FITS[purpose]);
  },
};
