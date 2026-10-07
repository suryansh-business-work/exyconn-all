import type { AiRequest, BotContent, ChatState, EngineResult } from '@exyconn/wa-flow';
import { respond, type EngineContext } from '@exyconn/wa-flow/engine';
import { play } from '../../../../../src/modules/whatsapp-demo/channel/channel.play';
import { parseAs } from '../../../../../src/modules/whatsapp-demo/whatsappDemo.parse';
import { demoBundle } from './channel.fixtures';

jest.mock('@exyconn/wa-flow/engine', () => ({
  ...jest.requireActual('@exyconn/wa-flow/engine'),
  respond: jest.fn(),
}));
jest.mock('../../../../../src/modules/whatsapp-demo/whatsappDemo.parse', () => ({
  parseAs: jest.fn(),
}));

const responded = respond as jest.MockedFunction<typeof respond>;
const parsed = parseAs as jest.MockedFunction<typeof parseAs>;

const bundle = demoBundle('salon');
const ctx = { now: 0 } as EngineContext;
const actor = { id: 'wa:abc', name: 'Asha', email: '+••01' };
const analytics = { actor, sessionId: 'wa-s1' };
const state = (seq: number): ChatState => ({ demoKey: 'salon', vars: {}, seq, seed: 1 });
const text = (body: string): BotContent => ({ type: 'text', text: body });

function result(
  seq: number,
  replies: BotContent[],
  extra: Partial<EngineResult> = {},
): EngineResult {
  return {
    state: state(seq),
    sent: { id: 'u', from: 'user', at: 0, content: { type: 'text', text: 'typed' } },
    replies: replies.map((content, i) => ({
      message: { id: `b${seq}-${i}`, from: 'bot', at: 0, content },
      typingMs: 0,
    })),
    scheduled: [],
    signals: [],
    ...extra,
  };
}

const aiRequest: AiRequest = {
  workflow: 'booking',
  node: 'ask',
  text: 'tomorrow at 5',
  intents: [{ id: 'book', description: 'Book' }],
  entities: [],
};

describe('play', () => {
  it('returns the engine reply when no AI read is needed', async () => {
    const push = { id: 'p', demoKey: 'salon', workflow: 'w', node: 'n', at: 9 };
    const signal = { type: 'FLOW_STARTED' as const, workflow: 'w', node: 'n' };
    responded.mockReturnValueOnce(
      result(1, [text('Hello')], { scheduled: [push], signals: [signal] }),
    );

    const played = await play(bundle, state(0), { type: 'start' }, ctx, analytics);

    expect(responded).toHaveBeenCalledWith(bundle, state(0), { type: 'start' }, ctx);
    expect(played).toEqual({
      state: state(1),
      contents: [text('Hello')],
      scheduled: [push],
      signals: [signal],
    });
    expect(parsed).not.toHaveBeenCalled();
  });

  it('keeps only what the bot says, not the customer echo', async () => {
    const reply = result(1, [text('Bot')]);
    reply.replies.push({
      message: { id: 'echo', from: 'user', at: 0, content: { type: 'text', text: 'mine' } },
      typingMs: 0,
    });
    responded.mockReturnValueOnce(reply);

    const played = await play(bundle, state(0), { type: 'text', text: 'hi' }, ctx, analytics);

    expect(played.contents).toEqual([text('Bot')]);
  });

  it('reads the text with AI when asked, then plays the reading', async () => {
    responded
      .mockReturnValueOnce(result(1, [text('Let me check')], { ai: aiRequest }))
      .mockReturnValueOnce(result(2, [text('Booked for 5')]));
    parsed.mockResolvedValueOnce({
      ok: true,
      intent: 'book',
      entities: { time: '17:00' },
      latencyMs: 10,
      error: null,
    });

    const played = await play(bundle, state(0), { type: 'text', text: 'x' }, ctx, analytics);

    expect(parsed).toHaveBeenCalledWith(actor, {
      sessionId: 'wa-s1',
      demoKey: 'salon',
      ...aiRequest,
    });
    expect(responded).toHaveBeenLastCalledWith(
      bundle,
      state(1),
      { type: 'ai', request: aiRequest, result: { intent: 'book', entities: { time: '17:00' } } },
      ctx,
    );
    expect(played.state).toEqual(state(2));
    expect(played.contents).toEqual([text('Let me check'), text('Booked for 5')]);
  });

  it('tells the engine the reading failed when the AI could not answer', async () => {
    const first = { id: 'p1', demoKey: 'salon', workflow: 'w', node: 'a', at: 1 };
    const second = { id: 'p2', demoKey: 'salon', workflow: 'w', node: 'b', at: 2 };
    responded
      .mockReturnValueOnce(result(1, [], { ai: aiRequest, scheduled: [first] }))
      .mockReturnValueOnce(result(2, [text('Sorry')], { scheduled: [second] }));
    parsed.mockResolvedValueOnce({
      ok: false,
      intent: null,
      entities: {},
      latencyMs: 0,
      error: 'TIMEOUT',
    });

    const played = await play(bundle, state(0), { type: 'text', text: 'x' }, ctx, analytics);

    expect(responded.mock.calls[1][2]).toEqual({ type: 'ai', request: aiRequest, result: null });
    expect(played.scheduled).toEqual([first, second]);
    expect(played.contents).toEqual([text('Sorry')]);
  });
});
