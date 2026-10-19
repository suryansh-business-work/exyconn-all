import {
  accountUrl,
  basicAuth,
  placeTwilioCall,
  verifyTwilio,
} from '../../../../src/modules/calling-bot-demo/twilio.client';
import { logger } from '../../../../src/utils/logger';
import { credential, jsonResponse, mockFetch, sentBody } from './callingBot.fixtures';

const TOKEN = credential('twilio');
const config = {
  twilioAccountSid: 'AC123',
  twilioAuthToken: TOKEN,
  twilioNumber: '+15550000001',
  maxCallSeconds: 90,
};
const call = {
  config,
  to: '+919876543210',
  answerUrl: 'https://voice.example/twilio/answer?ticket=t',
  statusUrl: 'https://voice.example/twilio/status?ticket=t',
};

afterEach(() => jest.restoreAllMocks());

describe('accountUrl / basicAuth', () => {
  it('addresses the account, escaping the SID', () => {
    expect(accountUrl('AC 1/2')).toBe('https://api.twilio.com/2010-04-01/Accounts/AC%201%2F2');
  });

  it('encodes SID and token as HTTP basic credentials', () => {
    const header = basicAuth('AC123', TOKEN);
    expect(header.startsWith('Basic ')).toBe(true);
    expect(Buffer.from(header.slice(6), 'base64').toString('utf8')).toBe(`AC123:${TOKEN}`);
  });
});

describe('placeTwilioCall', () => {
  it('posts the call with the callbacks and time limit, and resolves to its SID', async () => {
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ sid: 'CA1' }, 201));
    await expect(placeTwilioCall(call)).resolves.toBe('CA1');
    expect(fetchMock.mock.calls[0][0]).toBe(`${accountUrl('AC123')}/Calls.json`);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe(basicAuth('AC123', TOKEN));
    const form = new URLSearchParams(sentBody(fetchMock));
    expect(form.get('To')).toBe('+919876543210');
    expect(form.get('From')).toBe('+15550000001');
    expect(form.get('Url')).toBe(call.answerUrl);
    expect(form.get('StatusCallback')).toBe(call.statusUrl);
    expect(form.get('TimeLimit')).toBe('90');
  });

  it('resolves to an empty id when Twilio names none', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}, 201));
    await expect(placeTwilioCall(call)).resolves.toBe('');
  });

  it('refuses with a browser-call hint, logging Twilio’s error code', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ code: 21_211, message: 'Invalid To' }, 400));
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await expect(placeTwilioCall(call)).rejects.toThrow('Try the browser call instead');
    expect(warn).toHaveBeenCalledWith('Twilio refused a call: HTTP 400 code 21211');
  });

  it('logs "none" when the refusal has no readable body', async () => {
    mockFetch().mockResolvedValue(new Response('<html>down</html>', { status: 503 }));
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await expect(placeTwilioCall(call)).rejects.toThrow('could not be placed');
    expect(warn).toHaveBeenCalledWith('Twilio refused a call: HTTP 503 code none');
  });
});

describe('verifyTwilio', () => {
  it('reads the account and resolves to its friendly name', async () => {
    const fetchMock = mockFetch().mockResolvedValue(
      jsonResponse({ friendly_name: 'Exyconn', status: 'active' }),
    );
    await expect(verifyTwilio('AC123', TOKEN)).resolves.toBe('Exyconn');
    expect(fetchMock.mock.calls[0][0]).toBe(`${accountUrl('AC123')}.json`);
  });

  it('falls back to the SID when the account has no name or status', async () => {
    mockFetch().mockResolvedValue(jsonResponse({}));
    await expect(verifyTwilio('AC123', TOKEN)).resolves.toBe('AC123');
  });

  it('refuses wrong credentials with the HTTP status', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ message: 'Authenticate' }, 401));
    await expect(verifyTwilio('AC123', TOKEN)).rejects.toThrow(
      'Twilio refused the Account SID or Auth Token (HTTP 401).',
    );
  });

  it('refuses a suspended account', async () => {
    mockFetch().mockResolvedValue(jsonResponse({ friendly_name: 'Old', status: 'suspended' }));
    await expect(verifyTwilio('AC123', TOKEN)).rejects.toThrow('The Twilio account is suspended.');
  });
});
