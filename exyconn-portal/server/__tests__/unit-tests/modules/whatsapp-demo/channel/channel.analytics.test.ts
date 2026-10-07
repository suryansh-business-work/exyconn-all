import {
  actorOf,
  fromSignal,
  recordChatEvents,
  sessionFor,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.analytics';
import { storeActorEvents } from '../../../../../src/modules/whatsapp-demo/whatsappDemo.events';
import { SESSION_IDLE_MS } from '../../../../../src/modules/whatsapp-demo/whatsappDemo.present';
import { logger } from '../../../../../src/utils/logger';

jest.mock('../../../../../src/modules/whatsapp-demo/whatsappDemo.events', () => ({
  storeActorEvents: jest.fn().mockResolvedValue(1),
}));

const stored = storeActorEvents as jest.MockedFunction<typeof storeActorEvents>;
const WA_ID = '919800000001';

afterEach(() => jest.restoreAllMocks());

describe('actorOf', () => {
  it('identifies a person by a hash of their number and shows the number masked', () => {
    const actor = actorOf({ waId: WA_ID, name: 'Asha' });

    expect(actor.id).toMatch(/^wa:[0-9a-f]{24}$/);
    expect(actor.id).not.toContain(WA_ID);
    expect(actor.name).toBe('Asha');
    expect(actor.email).toBe('+••••••••0001');
  });

  it('is the same person on every message, and another person for another number', () => {
    expect(actorOf({ waId: WA_ID, name: 'A' }).id).toBe(actorOf({ waId: WA_ID, name: 'B' }).id);
    expect(actorOf({ waId: '919800000002', name: 'A' }).id).not.toBe(
      actorOf({ waId: WA_ID, name: 'A' }).id,
    );
  });

  it('falls back to the masked number when WhatsApp sent no name', () => {
    expect(actorOf({ waId: WA_ID, name: '' }).name).toBe('+••••••••0001');
  });

  it('masks nothing of a number of four digits or fewer', () => {
    expect(actorOf({ waId: '12', name: '' }).email).toBe('+12');
  });
});

describe('sessionFor', () => {
  const now = Date.UTC(2026, 9, 7, 12);

  it('starts a session for a first message', () => {
    expect(sessionFor(null, null, now)).toEqual({
      id: expect.stringMatching(/^wa-/),
      started: true,
    });
    expect(sessionFor('wa-old', null, now).started).toBe(true);
  });

  it('keeps the session while the chat is active, up to the idle limit', () => {
    const recent = new Date(now - SESSION_IDLE_MS);
    expect(sessionFor('wa-old', recent, now)).toEqual({ id: 'wa-old', started: false });
  });

  it('starts a new session after a long silence', () => {
    const stale = new Date(now - SESSION_IDLE_MS - 1);
    const session = sessionFor('wa-old', stale, now);
    expect(session.started).toBe(true);
    expect(session.id).not.toBe('wa-old');
  });
});

describe('fromSignal', () => {
  it('keeps a step kind and label', () => {
    expect(
      fromSignal({ type: 'STEP', workflow: 'w', node: 'n', stepKind: 'choice', label: 'Yes' }, 'k'),
    ).toEqual({
      type: 'STEP',
      demoKey: 'k',
      workflow: 'w',
      node: 'n',
      stepKind: 'choice',
      label: 'Yes',
    });
  });

  it('keeps only where a flow event happened', () => {
    expect(fromSignal({ type: 'FLOW_COMPLETED', workflow: 'w', node: 'n' }, 'k')).toEqual({
      type: 'FLOW_COMPLETED',
      demoKey: 'k',
      workflow: 'w',
      node: 'n',
    });
  });
});

describe('recordChatEvents', () => {
  const actor = actorOf({ waId: WA_ID, name: 'Asha' });

  it('records nothing when nothing happened', async () => {
    await recordChatEvents(actor, 'wa-s', []);
    expect(stored).not.toHaveBeenCalled();
  });

  it('stores each event for the actor, the session start tagged as WhatsApp', async () => {
    await recordChatEvents(actor, 'wa-s', [
      { type: 'SESSION_START', demoKey: null },
      {
        type: 'STEP',
        demoKey: 'k',
        workflow: 'w',
        node: 'n',
        stepKind: 'text',
        label: 'x'.repeat(90),
      },
    ]);

    const [who, events] = stored.mock.calls[0];
    expect(who).toBe(actor);
    expect(events[0]).toEqual({
      eventId: expect.stringMatching(/^wa-/),
      sessionId: 'wa-s',
      userId: actor.id,
      type: 'SESSION_START',
      at: expect.any(Date),
      demoKey: null,
      workflow: null,
      node: null,
      stepKind: null,
      label: null,
      durationMs: null,
      meta: null,
      device: 'whatsapp',
    });
    expect(events[1]).toEqual(
      expect.objectContaining({ workflow: 'w', node: 'n', stepKind: 'text', device: null }),
    );
    expect(events[1].label).toHaveLength(80);
    expect(events[0].eventId).not.toBe(events[1].eventId);
  });

  it('only logs a failure, so analytics never stops a conversation', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    stored.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordChatEvents(actor, 'wa-s', [{ type: 'DEMO_OPENED', demoKey: 'k' }]),
    ).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'WhatsApp channel analytics could not be recorded',
    );
  });
});
