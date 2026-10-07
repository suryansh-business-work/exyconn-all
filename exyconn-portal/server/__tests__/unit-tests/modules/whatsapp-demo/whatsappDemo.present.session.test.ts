import { Types } from 'mongoose';
import {
  SESSION_IDLE_MS,
  presentEvent,
  presentSession,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.present';

type SessionRow = Parameters<typeof presentSession>[0];
type EventRow = Parameters<typeof presentEvent>[0];

describe('a session and its events as the API shows them', () => {
  const started = new Date('2026-10-01T10:00:00.000Z');
  const session = (lastEventAt: Date, fields: Partial<SessionRow> = {}): SessionRow => ({
    _id: new Types.ObjectId(),
    sessionId: 's-1',
    userId: 'u-1',
    userName: 'Asha',
    userEmail: 'asha@example.com',
    startedAt: started,
    lastEventAt,
    durationMs: lastEventAt.getTime() - started.getTime(),
    device: 'mobile',
    viewport: '390x844',
    demos: ['salon'],
    flowsStarted: 2,
    flowsCompleted: 1,
    events: 9,
    ...fields,
  });

  it('is active within the idle window and ended after it', () => {
    const last = new Date('2026-10-01T10:10:00.000Z');
    expect(presentSession(session(last), last.getTime() + SESSION_IDLE_MS).status).toBe('active');
    expect(presentSession(session(last), last.getTime() + SESSION_IDLE_MS + 1).status).toBe(
      'ended',
    );
  });

  it('fills what an old session row lacks', () => {
    const presented = presentSession(
      session(started, {
        userName: undefined,
        userEmail: undefined,
        durationMs: undefined,
        device: undefined,
        viewport: undefined,
        demos: undefined,
        flowsStarted: undefined,
        flowsCompleted: undefined,
        events: undefined,
      } as unknown as Partial<SessionRow>),
    );
    expect(presented).toMatchObject({
      userName: '',
      userEmail: '',
      durationMs: 0,
      device: null,
      viewport: null,
      demos: [],
      flowsStarted: 0,
      flowsCompleted: 0,
      events: 0,
      startedAt: started.toISOString(),
    });
  });

  it('shows an event by its client id, with nulls for what it does not carry', () => {
    const row = {
      _id: new Types.ObjectId(),
      eventId: 'e-1',
      sessionId: 's-1',
      userId: 'u-1',
      type: 'STEP',
      at: started,
    } as unknown as EventRow;
    expect(presentEvent(row)).toEqual({
      id: 'e-1',
      type: 'STEP',
      at: started.toISOString(),
      demoKey: null,
      workflow: null,
      node: null,
      stepKind: null,
      label: null,
      durationMs: null,
      meta: null,
    });
  });

  it('keeps what an event does carry', () => {
    const row = {
      _id: new Types.ObjectId(),
      eventId: 'e-2',
      type: 'AI_CALL',
      at: started,
      demoKey: 'salon',
      workflow: 'booking',
      node: 'ask',
      stepKind: 'text',
      label: 'name',
      durationMs: 120,
      meta: { ok: true },
    } as unknown as EventRow;
    expect(presentEvent(row)).toMatchObject({
      demoKey: 'salon',
      durationMs: 120,
      meta: { ok: true },
    });
  });
});
