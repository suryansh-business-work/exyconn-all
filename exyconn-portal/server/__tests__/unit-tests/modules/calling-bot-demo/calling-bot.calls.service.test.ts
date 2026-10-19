import { readCallTicket } from '@exyconn/calling-bot-demo-server';
import { callingBotCalls } from '../../../../src/modules/calling-bot-demo/calling-bot.calls.service';
import { callingBotConfigs } from '../../../../src/modules/calling-bot-demo/calling-bot.config.service';
import { callingBotScenarios } from '../../../../src/modules/calling-bot-demo/calling-bot.scenarios.service';
import { CallingBotCallModel } from '../../../../src/modules/calling-bot-demo/calling-bot.models';
import { logger } from '../../../../src/utils/logger';
import {
  configInput,
  jsonResponse,
  mockFetch,
  scenarioInput,
  twilioFields,
  UNKNOWN_ID,
  vobizFields,
} from './callingBot.fixtures';

const VOICE = 'https://demos.exyconn.com/calling-bot-demo/api';
const caller = { id: 'visitor:v1', name: 'Asha', email: 'Asha@Example.com' };
const PHONE = '+919876543210';

const activeConfig = (fields = {}) =>
  callingBotConfigs.create(configInput({ isActive: true, ...fields }));

/** The ticket in a voice-server URL, checked with the config's secret. */
function ticketIn(url: string, secret: string) {
  const ticket = new URL(url).searchParams.get('ticket') ?? '';
  return readCallTicket(secret, ticket);
}

afterEach(() => jest.restoreAllMocks());

describe('availability', () => {
  it('says nothing is available without an active config', async () => {
    await callingBotConfigs.create(configInput());
    await expect(callingBotCalls.availability()).resolves.toEqual({
      available: false,
      phoneEnabled: false,
      languageCode: null,
      maxCallSeconds: null,
    });
  });

  it('describes the active config, with or without phones', async () => {
    await activeConfig();
    await expect(callingBotCalls.availability()).resolves.toEqual({
      available: true,
      phoneEnabled: false,
      languageCode: 'en-IN',
      maxCallSeconds: 120,
    });
    await activeConfig(twilioFields());
    expect((await callingBotCalls.availability()).phoneEnabled).toBe(true);
  });
});

describe('start — browser', () => {
  it('records the call and hands back a socket address with a ticket for it', async () => {
    const config = await activeConfig();
    const { call, socketUrl } = await callingBotCalls.start(caller, {
      channel: 'BROWSER',
      phone: PHONE,
    });
    expect(call).toMatchObject({
      channel: 'BROWSER',
      status: 'STARTING',
      callerId: 'visitor:v1',
      callerName: 'Asha',
      callerEmail: 'asha@example.com',
      phone: '',
      languageCode: 'en-IN',
      scenarioId: '',
      scenarioTitle: '',
    });
    expect(socketUrl?.startsWith('wss://demos.exyconn.com/calling-bot-demo/api/browser?ticket=')).toBe(
      true,
    );
    const claims = ticketIn(socketUrl ?? '', config.ticketSecret);
    expect(claims?.callId).toBe(String(call._id));
    expect(claims?.exp).toBeLessThanOrEqual(Date.now() + 120_000);
    expect(claims?.exp).toBeGreaterThan(Date.now() + 110_000);
  });

  it('plays a picked example, in its language when it names one', async () => {
    await activeConfig();
    const plain = await callingBotScenarios.create(scenarioInput());
    const hindi = await callingBotScenarios.create(
      scenarioInput({ title: 'Loan reminder', languageCode: 'hi-IN' }),
    );
    const first = await callingBotCalls.start(caller, {
      channel: 'BROWSER',
      scenarioId: String(plain._id),
    });
    expect(first.call).toMatchObject({
      languageCode: 'en-IN',
      scenarioId: String(plain._id),
      scenarioTitle: 'Clinic booking',
    });
    const second = await callingBotCalls.start(caller, {
      channel: 'BROWSER',
      scenarioId: String(hindi._id),
    });
    expect(second.call).toMatchObject({ languageCode: 'hi-IN', scenarioTitle: 'Loan reminder' });
  });

  it('refuses when no config is active, or the example is gone', async () => {
    await expect(callingBotCalls.start(caller, { channel: 'BROWSER' })).rejects.toThrow(
      'The calling bot is not set up yet.',
    );
    await activeConfig();
    await expect(
      callingBotCalls.start(caller, { channel: 'BROWSER', scenarioId: UNKNOWN_ID }),
    ).rejects.toThrow('That example is no longer offered.');
    expect(await CallingBotCallModel.countDocuments()).toBe(0);
  });

  it('allows a caller ten calls an hour', async () => {
    await activeConfig();
    for (let i = 0; i < 10; i += 1) {
      await callingBotCalls.start(caller, { channel: 'BROWSER' });
    }
    await expect(callingBotCalls.start(caller, { channel: 'BROWSER' })).rejects.toThrow('Too many calls.');
    expect(await CallingBotCallModel.countDocuments()).toBe(10);
  });
});

describe('start — phone', () => {
  it('rings through Twilio with ticketed callbacks and returns the ringing call', async () => {
    const config = await activeConfig(twilioFields());
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ sid: 'CA1' }, 201));
    const { call, socketUrl } = await callingBotCalls.start(caller, {
      channel: 'PHONE',
      phone: ` ${PHONE} `,
    });
    expect(socketUrl).toBeNull();
    expect(call).toMatchObject({ phone: PHONE, status: 'RINGING', providerCallId: 'CA1' });
    expect(String(fetchMock.mock.calls[0][0])).toContain('api.twilio.com');
    const form = new URLSearchParams(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(form.get('Url')?.startsWith(`${VOICE}/twilio/answer?ticket=`)).toBe(true);
    expect(form.get('StatusCallback')?.startsWith(`${VOICE}/twilio/status?ticket=`)).toBe(true);
    const claims = ticketIn(form.get('Url') ?? '', config.ticketSecret);
    expect(claims?.callId).toBe(String(call._id));
    expect(claims?.exp).toBeGreaterThan(Date.now() + (120 + 110) * 1000);
  });

  it('rings through Vobiz when that is the provider', async () => {
    await activeConfig(vobizFields());
    const fetchMock = mockFetch().mockResolvedValue(jsonResponse({ request_uuid: 'req-1' }, 201));
    const { call } = await callingBotCalls.start(caller, { channel: 'PHONE', phone: PHONE });
    expect(call).toMatchObject({ status: 'RINGING', providerCallId: 'req-1' });
    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.answer_url.startsWith(`${VOICE}/vobiz/answer?ticket=`)).toBe(true);
    expect(body.hangup_url.startsWith(`${VOICE}/vobiz/hangup?ticket=`)).toBe(true);
  });

  it('marks the call failed when the provider refuses, and says so', async () => {
    await activeConfig(vobizFields());
    mockFetch().mockResolvedValue(jsonResponse({}, 402));
    jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    await expect(
      callingBotCalls.start(caller, { channel: 'PHONE', phone: PHONE }),
    ).rejects.toThrow('out of balance');
    const failed = await CallingBotCallModel.findOne().lean();
    expect(failed).toMatchObject({
      status: 'FAILED',
      endReason: 'The phone call could not be placed',
    });
    expect(failed?.endedAt).toBeInstanceOf(Date);
  });

  it('refuses phone calls a config cannot place, and numbers without a country code', async () => {
    await activeConfig();
    await expect(
      callingBotCalls.start(caller, { channel: 'PHONE', phone: PHONE }),
    ).rejects.toThrow('Phone calls are not set up.');
    await activeConfig(twilioFields());
    for (const phone of ['9876543210', null]) {
      await expect(callingBotCalls.start(caller, { channel: 'PHONE', phone })).rejects.toThrow(
        'Enter the number with its country code',
      );
    }
    expect(await CallingBotCallModel.countDocuments()).toBe(0);
  });

  it('rings one number at most three times a day, whoever asks', async () => {
    await activeConfig(twilioFields());
    mockFetch().mockImplementation(async () => jsonResponse({ sid: 'CA' }, 201));
    for (const id of ['a', 'b', 'c']) {
      await callingBotCalls.start({ ...caller, id }, { channel: 'PHONE', phone: PHONE });
    }
    await expect(
      callingBotCalls.start({ ...caller, id: 'd' }, { channel: 'PHONE', phone: PHONE }),
    ).rejects.toThrow('Too many calls to this number.');
  });

  it('allows a caller three phone calls an hour', async () => {
    await activeConfig(twilioFields());
    mockFetch().mockImplementation(async () => jsonResponse({ sid: 'CA' }, 201));
    for (const n of ['1', '2', '3']) {
      await callingBotCalls.start(caller, { channel: 'PHONE', phone: `+91987654321${n}` });
    }
    await expect(
      callingBotCalls.start(caller, { channel: 'PHONE', phone: '+919876543214' }),
    ).rejects.toThrow('Too many phone calls.');
  });
});

describe('ownCall / recent', () => {
  it('finds only the caller’s own call', async () => {
    await activeConfig();
    const { call } = await callingBotCalls.start(caller, { channel: 'BROWSER' });
    expect((await callingBotCalls.ownCall(caller, String(call._id))).callerId).toBe('visitor:v1');
    await expect(
      callingBotCalls.ownCall({ ...caller, id: 'someone-else' }, String(call._id)),
    ).rejects.toThrow('Call not found');
  });

  it('lists the most recent calls first, up to the limit', async () => {
    await activeConfig();
    for (const id of ['first', 'second', 'third']) {
      await callingBotCalls.start({ ...caller, id }, { channel: 'BROWSER' });
    }
    expect((await callingBotCalls.recent(2)).map((call) => call.callerId)).toEqual([
      'third',
      'second',
    ]);
  });
});
