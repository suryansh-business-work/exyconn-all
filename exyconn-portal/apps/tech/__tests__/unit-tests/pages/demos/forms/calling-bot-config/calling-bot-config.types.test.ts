import { describe, expect, it } from 'vitest';
import { CallingBotPhoneProvider } from '@exyconn/shell/graphql/generated';
import {
  MODEL_OPTIONS,
  VOICES,
  makeSchema,
} from '../../../../../../src/pages/demos/forms/calling-bot-config/calling-bot-config.types';
import { fakeSecret } from '../../../environment-variables/forms/form.helpers';

const SID = `AC${'0f'.repeat(16)}`;

/** A complete browser-only config, as the form would submit it. */
const valid = (overrides: Record<string, unknown> = {}) => ({
  label: 'Clinic bot',
  sarvamApiKey: fakeSecret('sv-', 20),
  openAiApiKey: fakeSecret('sk-', 24),
  openAiModel: 'gpt-4o-mini',
  systemPrompt: 'You book appointments for a dental clinic.',
  greeting: 'Namaste',
  languageCode: 'hi-IN',
  ttsModel: 'bulbul:v2',
  ttsSpeaker: 'anushka',
  maxCallSeconds: '300',
  phoneProvider: CallingBotPhoneProvider.None,
  vobizAuthId: '',
  vobizAuthToken: '',
  vobizNumber: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioNumber: '',
  isActive: 'true',
  ...overrides,
});

/** The message each failing field reports, by field. */
function problems(isEdit: boolean, values: Record<string, unknown>): Record<string, string> {
  const result = makeSchema(isEdit).safeParse(values);
  if (result.success) {
    return {};
  }
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
}

describe('calling bot config options', () => {
  it('offers each Sarvam voice model once', () => {
    expect(MODEL_OPTIONS).toEqual(Object.keys(VOICES).map((value) => ({ value, label: value })));
  });
});

describe('makeSchema', () => {
  it('accepts a complete browser-only config and coerces the call length', () => {
    const result = makeSchema(false).parse(valid());
    expect(result.maxCallSeconds).toBe(300);
  });

  it('needs both keys, a label, a prompt and a greeting to create', () => {
    expect(
      problems(
        false,
        valid({
          label: ' ',
          sarvamApiKey: '',
          openAiApiKey: '',
          systemPrompt: 'Short',
          greeting: 'x',
        }),
      ),
    ).toEqual({
      label: 'Label is required',
      sarvamApiKey: 'Sarvam AI key is required',
      openAiApiKey: 'OpenAI key is required',
      systemPrompt: 'Describe the bot in at least a sentence',
      greeting: 'Greeting is required',
    });
  });

  it('keeps the saved keys when an edit leaves them blank', () => {
    expect(problems(true, valid({ sarvamApiKey: '', openAiApiKey: '' }))).toEqual({});
  });

  it('rejects an OpenAI key that does not start with sk-', () => {
    expect(problems(true, valid({ openAiApiKey: fakeSecret('pk-', 24) }))).toEqual({
      openAiApiKey: 'OpenAI keys start with "sk-"',
    });
  });

  it.each([
    ['29', 'At least 30 seconds'],
    ['901', 'At most 15 minutes'],
  ])('bounds the call length: %s seconds', (seconds, message) => {
    expect(problems(false, valid({ maxCallSeconds: seconds }))).toEqual({
      maxCallSeconds: message,
    });
  });

  it('takes whole seconds only', () => {
    expect(problems(false, valid({ maxCallSeconds: '30.5' }))).toHaveProperty('maxCallSeconds');
  });

  it('asks for every Vobiz detail on a new config', () => {
    expect(problems(false, valid({ phoneProvider: CallingBotPhoneProvider.Vobiz }))).toEqual({
      vobizAuthId: 'Vobiz Auth ID is required',
      vobizAuthToken: 'Vobiz Auth Token is required',
      vobizNumber: 'The Vobiz calling number is required',
    });
  });

  it('lets an edit keep the saved Vobiz token, but not skip the ID or number', () => {
    const vobiz = { phoneProvider: CallingBotPhoneProvider.Vobiz };
    expect(problems(true, valid(vobiz))).toEqual({
      vobizAuthId: 'Vobiz Auth ID is required',
      vobizNumber: 'The Vobiz calling number is required',
    });
    expect(
      problems(true, valid({ ...vobiz, vobizAuthId: 'MA123', vobizNumber: '+918012345678' })),
    ).toEqual({});
  });

  it('asks for every Twilio detail on a new config', () => {
    expect(problems(false, valid({ phoneProvider: CallingBotPhoneProvider.Twilio }))).toEqual({
      twilioAccountSid: 'Twilio Account SID is required',
      twilioAuthToken: 'Twilio Auth Token is required',
      twilioNumber: 'The Twilio calling number is required',
    });
  });

  it('accepts a complete Twilio account', () => {
    expect(
      problems(
        false,
        valid({
          phoneProvider: CallingBotPhoneProvider.Twilio,
          twilioAccountSid: SID,
          twilioAuthToken: fakeSecret('tw', 32),
          twilioNumber: '+14155550100',
        }),
      ),
    ).toEqual({});
  });

  it('checks the shape of a Twilio SID and of calling numbers', () => {
    expect(
      problems(
        false,
        valid({ twilioAccountSid: 'AC123', twilioNumber: '4155550100', vobizNumber: '+0123' }),
      ),
    ).toEqual({
      twilioAccountSid: 'A Twilio Account SID starts with AC and has 34 characters',
      twilioNumber: 'Use E.164, e.g. +918012345678',
      vobizNumber: 'Use E.164, e.g. +918012345678',
    });
  });
});
