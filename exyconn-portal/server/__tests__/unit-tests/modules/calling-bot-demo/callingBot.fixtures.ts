import type { CallingBotConfigInput } from '../../../../src/modules/calling-bot-demo/calling-bot.config.service';
import type { CallingBotScenarioInput } from '../../../../src/modules/calling-bot-demo/calling-bot.scenarios.service';
import { credential } from '../tech/tech.fixtures';

export { credential };

/** Every setting Tech > Demos > Calling bot sends, with browser calls only. */
export const configInput = (
  overrides: Partial<CallingBotConfigInput> = {},
): CallingBotConfigInput => ({
  label: 'Primary',
  sarvamApiKey: credential('sarvam'),
  openAiApiKey: credential('openai'),
  openAiModel: 'gpt-4o-mini',
  systemPrompt: 'You are a friendly receptionist.',
  greeting: 'Hello, how can I help?',
  languageCode: 'en-IN',
  ttsModel: 'bulbul:v2',
  ttsSpeaker: 'anushka',
  maxCallSeconds: 120,
  phoneProvider: 'NONE',
  vobizAuthId: '',
  vobizAuthToken: '',
  vobizNumber: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioNumber: '',
  ...overrides,
});

/** A complete Vobiz account. */
export const vobizFields = (): Partial<CallingBotConfigInput> => ({
  phoneProvider: 'VOBIZ',
  vobizAuthId: 'MA_VOBIZ_ID',
  vobizAuthToken: credential('vobiz'),
  vobizNumber: '+918000000001',
});

/** A complete Twilio account. */
export const twilioFields = (): Partial<CallingBotConfigInput> => ({
  phoneProvider: 'TWILIO',
  twilioAccountSid: 'AC0000000000',
  twilioAuthToken: credential('twilio'),
  twilioNumber: '+15550000001',
});

export const scenarioInput = (
  overrides: Partial<CallingBotScenarioInput> = {},
): CallingBotScenarioInput => ({
  title: 'Clinic booking',
  description: 'Book a dentist appointment.',
  systemPrompt: 'You book appointments at a dental clinic.',
  greeting: 'Smile Dental, how can I help?',
  languageCode: '',
  enabled: true,
  order: 10,
  ...overrides,
});

/** A fetch answer with a JSON body. */
export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Replaces fetch for one test; restored by `jest.restoreAllMocks()`. */
export const mockFetch = () => jest.spyOn(globalThis, 'fetch');

/** The request body fetch was called with, at call `index`. */
export function sentBody(fetchMock: jest.SpyInstance, index = 0): string {
  const init = fetchMock.mock.calls[index][1] as RequestInit;
  return String(init.body);
}

/** An id no row has. */
export { UNKNOWN_ID } from '../tech/tech.fixtures';
