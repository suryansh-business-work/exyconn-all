import { describe, expect, it } from 'vitest';
import {
  CALL_STATUSES,
  CALLING_BOT_CALL_FIELDS,
  canPhone,
  isFinished,
  PHONE_PROVIDERS,
  TICKET_PARAM,
  VOICE_PATHS,
  withScenario,
  type PhoneSettings,
} from '../../../src/index';

const NO_PHONE: PhoneSettings = {
  phoneProvider: 'NONE',
  vobizAuthId: '',
  vobizAuthToken: '',
  vobizNumber: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioNumber: '',
};
const VOBIZ: PhoneSettings = {
  ...NO_PHONE,
  phoneProvider: 'VOBIZ',
  vobizAuthId: 'MA1',
  vobizAuthToken: 'vobiz-token',
  vobizNumber: '+911234567890',
};
const TWILIO: PhoneSettings = {
  ...NO_PHONE,
  phoneProvider: 'TWILIO',
  twilioAccountSid: 'AC1',
  twilioAuthToken: 'twilio-token',
  twilioNumber: '+15550100',
};

describe('whether a config can ring a real phone', () => {
  it('needs every field of the chosen provider', () => {
    expect(canPhone(VOBIZ)).toBe(true);
    expect(canPhone(TWILIO)).toBe(true);
  });

  it.each([
    ['Vobiz without a number', { ...VOBIZ, vobizNumber: '' }],
    ['Vobiz without a token', { ...VOBIZ, vobizAuthToken: '' }],
    ['Twilio without a SID', { ...TWILIO, twilioAccountSid: '' }],
    ['Twilio without a number', { ...TWILIO, twilioNumber: '' }],
    ['no provider, even with keys filled in', { ...VOBIZ, ...TWILIO, phoneProvider: 'NONE' }],
  ] as const)('refuses %s', (_name, config) => {
    expect(canPhone(config)).toBe(false);
  });

  it('offers exactly the three provider choices', () => {
    expect(PHONE_PROVIDERS).toEqual(['NONE', 'VOBIZ', 'TWILIO']);
  });
});

describe('a call record', () => {
  it('is finished only once it ended or failed', () => {
    expect(CALL_STATUSES.filter(isFinished)).toEqual(['ENDED', 'FAILED']);
  });

  it('starts with an empty transcript of its own', () => {
    const makeTranscript = CALLING_BOT_CALL_FIELDS.transcript.default;
    expect(makeTranscript()).toEqual([]);
    expect(makeTranscript()).not.toBe(makeTranscript());
  });
});

describe('a picked example', () => {
  const config = { systemPrompt: 'Base', greeting: 'Hi', languageCode: 'en-IN', callScript: '' };

  it('leaves the config alone when there is none', () => {
    expect(withScenario(config, null)).toBe(config);
  });

  it('sets the prompt, greeting and language, followed by its call flow', () => {
    const result = withScenario(config, {
      systemPrompt: 'Clinic',
      greeting: 'Namaste',
      languageCode: 'hi-IN',
      callScript: '  1. Ask the name  ',
    });
    expect(result).toEqual({
      systemPrompt: 'Clinic\n\n1. Ask the name',
      greeting: 'Namaste',
      languageCode: 'hi-IN',
      callScript: '',
    });
  });

  it('keeps the config language and adds no flow when it names neither', () => {
    const blankScript = withScenario(config, {
      systemPrompt: 'Clinic',
      greeting: 'Hello',
      languageCode: '',
      callScript: '   ',
    });
    expect(blankScript.systemPrompt).toBe('Clinic');
    expect(blankScript.languageCode).toBe('en-IN');
    const oldRow = withScenario(config, { systemPrompt: 'Loan', greeting: 'Hi', languageCode: '' });
    expect(oldRow.systemPrompt).toBe('Loan');
  });
});

describe('the voice server routes', () => {
  it('reads every ticket from one query parameter', () => {
    expect(TICKET_PARAM).toBe('ticket');
    expect(VOICE_PATHS.browser).toBe('/browser');
    expect(new Set(Object.values(VOICE_PATHS)).size).toBe(Object.keys(VOICE_PATHS).length);
  });
});
