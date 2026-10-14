import {
  canPhone,
  newTicketSecret,
  type CallingBotConfigRecord,
  type PhoneProvider,
  type PhoneSettings,
} from '@exyconn/calling-bot-demo-server';
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
  phoneProvider: PhoneProvider;
  vobizAuthId: string;
  vobizAuthToken: string;
  vobizNumber: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioNumber: string;
  isActive?: boolean | null;
}

/** Sarvam's text-to-speech, asked for one word: the cheapest call that proves the key works. */
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';

/** The keys that are never listed, nor overwritten when sent empty; only revealed one at a time. */
const SECRETS = ['sarvamApiKey', 'openAiApiKey', 'vobizAuthToken', 'twilioAuthToken'] as const;
export type CallingBotSecretField = (typeof SECRETS)[number];

function withoutBlankSecrets(input: CallingBotConfigInput): Partial<CallingBotConfigInput> {
  return SECRETS.reduce<Partial<CallingBotConfigInput>>(
    (update, field) => withoutBlankSecret(update, field),
    input,
  );
}

/** What the phone provider is called on an error. */
const PROVIDER_NAMES: Record<PhoneProvider, string> = {
  NONE: 'No phone provider',
  VOBIZ: 'Vobiz',
  TWILIO: 'Twilio',
};

/** A chosen phone provider must be complete once the saved keys are counted in. */
function assertPhoneComplete(config: PhoneSettings): void {
  if (config.phoneProvider !== 'NONE' && !canPhone(config)) {
    badRequest(
      `Fill in every ${PROVIDER_NAMES[config.phoneProvider]} field, or choose no phone calls.`,
    );
  }
}

/** Sarvam's text-to-speech settings a key is tried with. */
export type SarvamVoice = Pick<CallingBotConfigRecord, 'languageCode' | 'ttsSpeaker' | 'ttsModel'>;

/** Speaks one word with the key: the cheapest call that proves it, and the voice, work. */
export async function checkSarvam(apiKey: string, voice: SarvamVoice): Promise<void> {
  const response = await fetch(SARVAM_TTS_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Hello',
      language_code: voice.languageCode,
      speaker: voice.ttsSpeaker,
      model: voice.ttsModel,
    }),
  });
  if (response.status === 401 || response.status === 403) {
    badRequest('Sarvam AI refused the key. Create a new one at dashboard.sarvam.ai.');
  }
  if (!response.ok) {
    badRequest(`Sarvam AI refused the language or voice (HTTP ${response.status}).`);
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
    assertPhoneComplete(input);
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
    const before = await CallingBotConfigModel.findById(id).lean<CallingBotConfigRecord>();
    if (!before) notFound('Calling bot config');
    assertPhoneComplete({ ...before, ...withoutBlankSecrets(input) });
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
    await checkSarvam(config.sarvamApiKey, config);
    return true;
  },
};
