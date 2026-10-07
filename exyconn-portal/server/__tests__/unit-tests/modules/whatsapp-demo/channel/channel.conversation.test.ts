import { randomUUID } from 'node:crypto';
import type { EngineContext } from '@exyconn/wa-flow/engine';
import { converse } from '../../../../../src/modules/whatsapp-demo/channel/channel.conversation';
import { engineContext } from '../../../../../src/modules/whatsapp-demo/channel/channel.context';
import { play } from '../../../../../src/modules/whatsapp-demo/channel/channel.play';
import { sendMessage } from '../../../../../src/modules/whatsapp-demo/channel/channel.graph';
import {
  publishedBundles,
  saveChat,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.chats';
import {
  actorOf,
  recordChatEvents,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.analytics';
import { INDUSTRIES } from '../../../../../src/modules/whatsapp-demo/channel/channel.industries';
import { chatRecord, demoBundle, option } from './channel.fixtures';

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
const clinic = demoBundle('clinic', 'Clinic');
const ctx = {
  now: NOW,
  t: (source: string) => source,
  format: { date: String, time: String, day: String, money: String },
} as unknown as EngineContext;
const played = {
  state: { demoKey: 'salon', vars: {}, seq: 1, seed: 1 },
  contents: [{ type: 'text' as const, text: 'Welcome to the salon' }],
  scheduled: [{ id: 'p1', demoKey: 'salon', workflow: 'w', node: 'n', at: NOW + 60_000 }],
  signals: [{ type: 'FLOW_STARTED' as const, workflow: 'w', node: 'n' }],
};

beforeEach(() => {
  jest.mocked(publishedBundles).mockResolvedValue([salon, clinic]);
  jest.mocked(engineContext).mockResolvedValue(ctx);
  jest.mocked(play).mockResolvedValue(played);
  jest.mocked(sendMessage).mockResolvedValue(undefined);
});

const saved = () => jest.mocked(saveChat).mock.calls[0];
const recorded = () => jest.mocked(recordChatEvents).mock.calls[0];

describe('converse: choosing an industry', () => {
  it('answers a first message with the industry picker and opens a session', async () => {
    const chat = chatRecord();

    await converse(chat, { kind: 'text', text: 'hello' }, sender);

    expect(engineContext).toHaveBeenCalledWith({ waId: chat.waId, name: chat.name });
    expect(play).not.toHaveBeenCalled();
    const [, to, payload] = jest.mocked(sendMessage).mock.calls[0];
    expect(to).toBe(chat.waId);
    expect((payload.interactive as { type: string }).type).toBe('list');

    const [id, update] = saved();
    expect(id).toBe('chat-1');
    expect(update.demoKey).toBeNull();
    expect(Object.values(update.options).map((o) => o.ref.handle)).toEqual(['salon', 'clinic']);
    expect(update.sessionId).toMatch(/^wa-/);
    expect(update.lastEventAt).toEqual(new Date(NOW));

    const [actor, sessionId, events] = recorded();
    expect(actor).toEqual(actorOf(chat));
    expect(sessionId).toBe(update.sessionId);
    expect(events).toEqual([{ type: 'SESSION_START', demoKey: null }]);
  });

  it('starts the industry a message names, in the session already open', async () => {
    const chat = chatRecord({ sessionId: 'wa-open', lastEventAt: new Date(NOW - 1000) });

    await converse(chat, { kind: 'text', text: 'Salon' }, sender);

    expect(play).toHaveBeenCalledWith(
      salon,
      expect.objectContaining({ demoKey: 'salon', seq: 0 }),
      { type: 'start' },
      ctx,
      { actor: actorOf(chat), sessionId: 'wa-open' },
    );
    expect(jest.mocked(sendMessage).mock.calls[0][2]).toEqual({
      type: 'text',
      text: { body: 'Welcome to the salon', preview_url: false },
    });
    expect(saved()[1]).toEqual(
      expect.objectContaining({
        demoKey: 'salon',
        state: played.state,
        pending: played.scheduled,
        sessionId: 'wa-open',
      }),
    );
    expect(recorded()[2]).toEqual([
      { type: 'DEMO_OPENED', demoKey: 'salon' },
      { type: 'FLOW_STARTED', demoKey: 'salon', workflow: 'w', node: 'n' },
    ]);
  });

  it('shows the picker again when a tapped industry is no longer published', async () => {
    const gone = option('x', { workflow: INDUSTRIES, node: 'pick', handle: 'retired' });
    const chat = chatRecord({ options: { o1: gone } });

    await converse(chat, { kind: 'reply', id: 'o1' }, sender);

    expect(play).not.toHaveBeenCalled();
    expect(jest.mocked(sendMessage)).toHaveBeenCalledTimes(1);
    expect(saved()[1].demoKey).toBeNull();
    expect(Object.keys(saved()[1].options)).toContain('o1');
  });
});
