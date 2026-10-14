import { newTicketSecret, type CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { badRequest, notFound } from '../../utils/errors';
import { openAiClient } from '../../utils/openai';
import { requireSecret, withoutBlankSecret } from '../tech/tech.service';
import { CallingBotConfigModel } from './calling-bot.models';

/** What Tech > Demos > Calling bot sends: every setting, with the keys write-only. */
export interface CallingBotConfigInput {
  label: string;
  /** Empty when editing keeps the stored key, as on every credential screen. */
  sarvamApiKey: string;
  openAiApiKey: string;
  openAiModel: string;
  systemPrompt: string;
  greeting: string;
  languageCode: string;
  ttsModel: string;
  ttsSpeaker: string;
  maxCallSeconds: number;
  vobizAuthId: string;
  vobizAuthToken: string;
  vobizNumber: string;
  isActive?: boolean | null;
}

/** Sarvam's text-to-speech, asked for one word: the cheapest call that proves the key works. */
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

/** The keys that are never listed, nor overwritten when sent empty; only revealed one at a time. */
const SECRETS = ['sarvamApiKey', 'openAiApiKey', 'vobizAuthToken'] as const;
export type CallingBotSecretField = (typeof SECRETS)[number];

function withoutBlankSecrets(input: CallingBotConfigInput): Partial<CallingBotConfigInput> {
  return SECRETS.reduce<Partial<CallingBotConfigInput>>(
    (update, field) => withoutBlankSecret(update, field),
    input,
  );
}

async function checkSarvam(config: CallingBotConfigRecord): Promise<void> {
  const response = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': config.sarvamApiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Hello',
      language_code: config.languageCode,
      speaker: config.ttsSpeaker,
      model: config.ttsModel,
    }),
  });
  if (!response.ok) {
    badRequest(`Sarvam AI refused the key, language or voice (HTTP ${response.status}).`);
  }
}

/** The calling bot's settings: the Tech screen's CRUD, one config active at a time. */
export const callingBotConfigs = {
  list() {
    return CallingBotConfigModel.find().sort({ createdAt: -1 }).lean<CallingBotConfigRecord[]>();
  },

  /** The config every call runs on, or null when none is active. */
  active() {
    return CallingBotConfigModel.findOne({ isActive: true }).lean<CallingBotConfigRecord>();
  },

  async create(input: CallingBotConfigInput) {
    requireSecret(input.sarvamApiKey, 'A Sarvam AI key');
    requireSecret(input.openAiApiKey, 'An OpenAI key');
    if (input.isActive) {
      await CallingBotConfigModel.updateMany({}, { isActive: false });
    }
    const created = await CallingBotConfigModel.create({
      ...input,
      ticketSecret: newTicketSecret(),
    });
    return created.toObject<CallingBotConfigRecord>();
  },

  async update(id: string, input: CallingBotConfigInput) {
    if (input.isActive) {
      await CallingBotConfigModel.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    const doc = await CallingBotConfigModel.findByIdAndUpdate(id, withoutBlankSecrets(input), {
      new: true,
      runValidators: true,
    }).lean<CallingBotConfigRecord>();
    if (!doc) notFound('Calling bot config');
    return doc;
  },

  async remove(id: string) {
    const doc = await CallingBotConfigModel.findByIdAndDelete(id).lean<CallingBotConfigRecord>();
    if (!doc) notFound('Calling bot config');
    return doc;
  },

  /** One stored key, for the Tech screen's eye button; the caller records who asked. */
  async reveal(id: string, field: CallingBotSecretField) {
    const config = await CallingBotConfigModel.findById(id)
      .select(`label ${field}`)
      .lean<CallingBotConfigRecord>();
    if (!config) notFound('Calling bot config');
    return { label: config.label, value: config[field] ?? '' };
  },

  /** Proves both keys: OpenAI can reach the model, Sarvam can speak in the chosen voice. */
  async test(id: string) {
    const config = await CallingBotConfigModel.findById(id).lean<CallingBotConfigRecord>();
    if (!config) notFound('Calling bot config');
    try {
      await openAiClient.verify({ apiKey: config.openAiApiKey, defaultModel: config.openAiModel });
    } catch {
      badRequest('OpenAI refused the key or cannot reach the model.');
    }
    await checkSarvam(config);
    return true;
  },
};
