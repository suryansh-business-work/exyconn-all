import type { CallingBotConfigRecord } from '@exyconn/calling-bot-demo-server';
import { badRequest, notFound } from '../../utils/errors';
import { openAiClient } from '../../utils/openai';
import { CallingBotConfigModel } from './calling-bot.models';
import { checkSarvam } from './calling-bot.config.service';
import { verifyTwilio } from './twilio.client';
import { verifyVobiz } from './vobiz.client';

/** The accounts the Tech screen can test one at a time, each from its own button. */
export type CallingBotKey = 'SARVAM' | 'OPENAI' | 'VOBIZ' | 'TWILIO';

/**
 * What the form holds when a Test button is pressed. A key left blank on an edit form means
 * "the saved one", so the config being edited (`configId`) fills it in.
 */
export interface KeyTestInput {
  configId?: string | null;
  key: CallingBotKey;
  sarvamApiKey?: string | null;
  languageCode?: string | null;
  ttsModel?: string | null;
  ttsSpeaker?: string | null;
  openAiApiKey?: string | null;
  openAiModel?: string | null;
  vobizAuthId?: string | null;
  vobizAuthToken?: string | null;
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
}

type Values = Omit<KeyTestInput, 'configId' | 'key'>;

/** A typed value, else the saved one, else a clear request for it. */
function pick(
  values: Values,
  saved: Partial<CallingBotConfigRecord>,
  field: keyof Values,
  label: string,
) {
  const value =
    values[field]?.trim() || (saved[field as keyof CallingBotConfigRecord] as string) || '';
  if (!value) {
    badRequest(`Enter the ${label} first.`);
  }
  return value;
}

async function savedConfig(configId?: string | null): Promise<Partial<CallingBotConfigRecord>> {
  if (!configId) {
    return {};
  }
  const config = await CallingBotConfigModel.findById(configId).lean<CallingBotConfigRecord>();
  if (!config) notFound('Calling bot config');
  return config;
}

/** One check per account, each resolving to what to tell the person who pressed Test. */
const CHECKS: Record<
  CallingBotKey,
  (values: Values, saved: Partial<CallingBotConfigRecord>) => Promise<string>
> = {
  async SARVAM(values, saved) {
    await checkSarvam(pick(values, saved, 'sarvamApiKey', 'Sarvam AI key'), {
      languageCode: pick(values, saved, 'languageCode', 'language'),
      ttsModel: pick(values, saved, 'ttsModel', 'voice model'),
      ttsSpeaker: pick(values, saved, 'ttsSpeaker', 'voice'),
    });
    return 'Sarvam AI accepted the key and spoke in the chosen voice.';
  },
  async OPENAI(values, saved) {
    const model = pick(values, saved, 'openAiModel', 'OpenAI model');
    try {
      await openAiClient.verify({
        apiKey: pick(values, saved, 'openAiApiKey', 'OpenAI key'),
        defaultModel: model,
      });
    } catch {
      badRequest(`OpenAI refused the key, or the key cannot use ${model}.`);
    }
    return `OpenAI accepted the key and can use ${model}.`;
  },
  async VOBIZ(values, saved) {
    await verifyVobiz(
      pick(values, saved, 'vobizAuthId', 'Vobiz Auth ID'),
      pick(values, saved, 'vobizAuthToken', 'Vobiz Auth Token'),
    );
    return 'Vobiz accepted the Auth ID and Auth Token.';
  },
  async TWILIO(values, saved) {
    const name = await verifyTwilio(
      pick(values, saved, 'twilioAccountSid', 'Twilio Account SID'),
      pick(values, saved, 'twilioAuthToken', 'Twilio Auth Token'),
    );
    return `Twilio accepted the credentials for "${name}".`;
  },
};

/** Tests one account from the Tech form, typed values first and saved ones for any blank. */
export async function testCallingBotKey({
  configId,
  key,
  ...values
}: KeyTestInput): Promise<string> {
  return CHECKS[key](values, await savedConfig(configId));
}
