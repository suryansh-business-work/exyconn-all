import { randomUUID } from 'node:crypto';
import type { PendingPush } from '@exyconn/wa-flow';
import type { EngineContext } from '@exyconn/wa-flow/engine';
import { converse } from '../../../../../src/modules/whatsapp-demo/channel/channel.conversation';
import { engineContext } from '../../../../../src/modules/whatsapp-demo/channel/channel.context';
import { play } from '../../../../../src/modules/whatsapp-demo/channel/channel.play';
import { sendMessage } from '../../../../../src/modules/whatsapp-demo/channel/channel.graph';
import {
  publishedBundles,
  saveChat,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';
import { recordChatEvents } from '../../../../../src/modules/whatsapp-demo/channel/channel.analytics';
import { logger } from '../../../../../src/utils/logger';
import { chatRecord, demoBundle } from './channel.fixtures';

jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.context', () => ({
  engineContext: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.play', () => ({
  play: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.graph', () => ({
  sendMessage: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.chats', () => ({
  ...jest.requireActual('../../../../../src/modules/whatsapp-demo/channel/channel.chats'),
  publishedBundles: jest.fn(),
  saveChat: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/channel/channel.analytics', () => ({
  ...jest.requireActual('../../../../../src/modules/whatsapp-demo/channel/channel.analytics'),
  recordChatEvents: jest.fn(),
}));

const NOW = Date.UTC(2026, 9, 7, 9);
const sender = { phoneNumberId: '1098765', accessToken: randomUUID() };
const salon = demoBundle('salon', 'Salon');
const ctx = {
  now: NOW,
  t: (source: string) => source,
  format: { date: String, time: String, day: String, money: String },
} as unknown as EngineContext;
const state = { demoKey: 'salon', vars: { name: 'Asha' }, seq: 4, seed: 7 };
const reminder = (id: string, demoKey = 'salon'): PendingPush => ({
  id,
  demoKey,
  workflow: 'booking',
  node: 'remind',
  at: NOW - 1,
});
const later = reminder('later');
const fresh = { id: 'new', demoKey: 'salon', workflow: 'w', node: 'n', at: NOW + 1 };
const step = { type: 'STEP' as const, node: 'ask', stepKind: 'text' as const, label: 'When' };

beforeEach(() => {
  jest.mocked(publishedBundles).mockResolvedValue([salon]);
  jest.mocked(engineContext).mockResolvedValue(ctx);
  jest.mocked(sendMessage).mockResolvedValue(undefined);
  jest.mocked(play).mockResolvedValue({
    state: { ...state, seq: 5 },
    contents: [
      { type: 'text', text: 'First' },
      { type: 'text', text: 'Second' },
    ],
    scheduled: [fresh],
    signals: [step],
  });
});

afterEach(() => jest.restoreAllMocks());

const saved = () => jest.mocked(saveChat).mock.calls[0][1];
const session = { sessionId: 'wa-open', lastEventAt: new Date(NOW - 1000) };

describe('converse: inside an industry', () => {
  it('plays typed text from the saved state and keeps the reminders still waiting', async () => {
    const chat = chatRecord({ demoKey: 'salon', state, pending: [later], ...session });

    await converse(chat, { kind: 'text', text: 'tomorrow' }, sender);

    expect(play).toHaveBeenCalledWith(salon, state, { type: 'text', text: 'tomorrow' }, ctx, {
      actor: expect.objectContaining({ id: expect.stringMatching(/^wa:/) }),
      sessionId: 'wa-open',
    });
    expect(jest.mocked(sendMessage).mock.calls.map((call) => call[2].text)).toEqual([
      { body: 'First', preview_url: false },
      { body: 'Second', preview_url: false },
    ]);
    expect(saved()).toEqual(
      expect.objectContaining({
        demoKey: 'salon',
        state: { ...state, seq: 5 },
        pending: [later, fresh],
      }),
    );
    expect(jest.mocked(recordChatEvents).mock.calls[0][2]).toEqual([
      {
        type: 'STEP',
        demoKey: 'salon',
        workflow: undefined,
        node: 'ask',
        stepKind: 'text',
        label: 'When',
      },
    ]);
  });

  it('starts the industry state afresh when none was saved', async () => {
    const chat = chatRecord({ demoKey: 'salon', ...session });

    await converse(chat, { kind: 'text', text: 'hi' }, sender);

    expect(jest.mocked(play).mock.calls[0][1]).toEqual(
      expect.objectContaining({ demoKey: 'salon', seq: 0, vars: {} }),
    );
  });

  it('delivers a due reminder and takes it off the queue', async () => {
    const due = reminder('due');
    const chat = chatRecord({ demoKey: 'salon', state, pending: [due, later], ...session });

    await converse(chat, { kind: 'push', push: due }, sender);

    expect(jest.mocked(play).mock.calls[0][2]).toEqual({ type: 'push', push: due });
    expect(saved().pending).toEqual([later, fresh]);
  });

  it('drops a reminder from an industry the chat has left, sending nothing', async () => {
    const stale = reminder('stale', 'clinic');
    const chat = chatRecord({ demoKey: 'salon', state, pending: [stale, later], ...session });

    await converse(chat, { kind: 'push', push: stale }, sender);

    expect(play).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(saved()).toEqual(expect.objectContaining({ state, pending: [later], demoKey: 'salon' }));
    expect(jest.mocked(recordChatEvents).mock.calls[0][2]).toEqual([]);
  });

  it('stops sending at the first refusal, and still saves the chat', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.mocked(sendMessage).mockRejectedValueOnce(new Error('Recipient not on WhatsApp'));
    const chat = chatRecord({ demoKey: 'salon', state, ...session });

    await converse(chat, { kind: 'text', text: 'hi' }, sender);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(warned).toHaveBeenCalledWith(
      { err: 'Recipient not on WhatsApp', type: 'text' },
      'WhatsApp channel could not send a reply',
    );
    expect(saveChat).toHaveBeenCalledTimes(1);
  });

  it('logs a refusal that is not an Error as it came', async () => {
    const warned = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.mocked(sendMessage).mockRejectedValueOnce('timeout');

    await converse(
      chatRecord({ demoKey: 'salon', state, ...session }),
      { kind: 'text', text: 'x' },
      sender,
    );

    expect(warned.mock.calls[0][0]).toEqual({ err: 'timeout', type: 'text' });
  });
});
