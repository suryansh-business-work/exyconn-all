import { randomUUID } from 'node:crypto';
import {
  MAX_EVENTS_PER_CALL,
  recordEvents,
  type EventActor,
  type WhatsappDemoEventInput,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.events';
import {
  WhatsappDemoEventModel,
  WhatsappDemoSessionModel,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';

const asha: EventActor = { id: 'user-asha', name: 'Asha', email: 'asha@example.com' };
const ravi: EventActor = { id: 'user-ravi', name: 'Ravi', email: 'ravi@example.com' };

const event = (fields: Partial<WhatsappDemoEventInput> = {}): WhatsappDemoEventInput => ({
  id: randomUUID(),
  sessionId: 'session-1',
  type: 'STEP',
  at: '2026-10-01T10:00:00.000Z',
  ...fields,
});

beforeAll(async () => {
  await WhatsappDemoEventModel.init();
  await WhatsappDemoSessionModel.init();
});

describe('recording the chat analytics', () => {
  it('refuses a batch bigger than one call may carry', async () => {
    const batch = Array.from({ length: MAX_EVENTS_PER_CALL + 1 }, () => event());
    await expect(recordEvents(asha, batch)).rejects.toThrow(
      'At most 100 events can be sent at once.',
    );
    expect(await WhatsappDemoEventModel.countDocuments()).toBe(0);
  });

  it('stores nothing for an empty batch', async () => {
    await expect(recordEvents(asha, [])).resolves.toBe(0);
  });

  it('drops malformed events, and AI calls the client claims to have made', async () => {
    const stored = await recordEvents(asha, [
      event({ type: 'AI_CALL' }),
      event({ type: 'NOT_A_TYPE' as WhatsappDemoEventInput['type'] }),
      event({ at: 'not a date' }),
      event({ id: '   ' }),
      event({ sessionId: '' }),
    ]);
    expect(stored).toBe(0);
    expect(await WhatsappDemoSessionModel.countDocuments()).toBe(0);
  });

  it('stores the events against the server-known actor and folds them into the session', async () => {
    const stored = await recordEvents(asha, [
      event({
        type: 'SESSION_START',
        at: '2026-10-01T10:00:00.000Z',
        device: 'mobile',
        viewport: '390x844',
      }),
      event({ type: 'DEMO_OPENED', demoKey: 'salon', at: '2026-10-01T10:01:00.000Z' }),
      event({
        type: 'FLOW_STARTED',
        demoKey: 'salon',
        workflow: 'booking',
        at: '2026-10-01T10:02:00.000Z',
      }),
      event({
        type: 'FLOW_COMPLETED',
        demoKey: 'salon',
        workflow: 'booking',
        at: '2026-10-01T10:05:00.000Z',
      }),
      event({ type: 'DEMO_OPENED', demoKey: 'clinic', at: '2026-10-01T10:06:00.000Z' }),
    ]);
    expect(stored).toBe(5);

    const session = await WhatsappDemoSessionModel.findOne({ sessionId: 'session-1' }).lean();
    expect(session).toMatchObject({
      userId: 'user-asha',
      userName: 'Asha',
      userEmail: 'asha@example.com',
      device: 'mobile',
      viewport: '390x844',
      events: 5,
      flowsStarted: 1,
      flowsCompleted: 1,
      durationMs: 6 * 60_000,
    });
    expect([...(session?.demos ?? [])].sort((a, b) => a.localeCompare(b))).toEqual([
      'clinic',
      'salon',
    ]);
    expect(session?.startedAt.toISOString()).toBe('2026-10-01T10:00:00.000Z');
    expect(session?.lastEventAt.toISOString()).toBe('2026-10-01T10:06:00.000Z');
    const rows = await WhatsappDemoEventModel.find().lean();
    expect(rows.every((row) => row.userId === 'user-asha')).toBe(true);
    expect(rows.some((row) => 'device' in row)).toBe(false);
  });

  it('grows a session across batches without moving its start or device', async () => {
    await recordEvents(asha, [
      event({ type: 'SESSION_START', at: '2026-10-01T10:00:00.000Z', device: 'desktop' }),
    ]);
    await recordEvents(asha, [
      event({ type: 'DOCUMENT_OPENED', at: '2026-10-01T10:30:00.000Z', device: 'mobile' }),
    ]);
    const session = await WhatsappDemoSessionModel.findOne({ sessionId: 'session-1' }).lean();
    expect(session).toMatchObject({
      events: 2,
      device: 'desktop',
      viewport: null,
      durationMs: 30 * 60_000,
    });
  });

  it('counts a resent event once', async () => {
    const first = event({ id: 'evt-1', type: 'SESSION_START' });
    await expect(recordEvents(asha, [first])).resolves.toBe(1);
    const again = await recordEvents(asha, [
      first,
      event({ id: 'evt-2', at: '2026-10-01T10:01:00.000Z' }),
    ]);
    expect(again).toBe(1);
    expect(await WhatsappDemoEventModel.countDocuments()).toBe(2);
    const session = await WhatsappDemoSessionModel.findOne({ sessionId: 'session-1' }).lean();
    expect(session?.events).toBe(2);
  });

  it('drops events for a session somebody else owns', async () => {
    await recordEvents(ravi, [event({ type: 'SESSION_START' })]);
    await expect(recordEvents(asha, [event()])).resolves.toBe(0);
    const session = await WhatsappDemoSessionModel.findOne({ sessionId: 'session-1' }).lean();
    expect(session).toMatchObject({ userId: 'user-ravi', events: 1 });
  });

  it('trims and bounds what the client sends', async () => {
    await recordEvents(asha, [
      event({
        id: 'evt-trim',
        label: `  ${'a'.repeat(100)}  `,
        stepKind: 'a-very-long-step-kind',
        demoKey: '   ',
        durationMs: 1234.6,
      }),
      event({ id: 'evt-negative', durationMs: -5 }),
    ]);
    const trimmed = await WhatsappDemoEventModel.findOne({ eventId: 'evt-trim' }).lean();
    expect(trimmed?.label).toHaveLength(80);
    expect(trimmed?.stepKind).toHaveLength(16);
    expect(trimmed?.demoKey).toBeNull();
    expect(trimmed?.durationMs).toBe(1235);
    const negative = await WhatsappDemoEventModel.findOne({ eventId: 'evt-negative' }).lean();
    expect(negative?.durationMs).toBeNull();
  });
});

describe('when the event store refuses a batch', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('stores nothing more when every failure is a duplicate and nothing went in', async () => {
    jest
      .spyOn(WhatsappDemoEventModel, 'insertMany')
      .mockRejectedValueOnce({ writeErrors: [{ err: { code: 11000 } }, { code: 11000 }] });
    await expect(recordEvents(asha, [event(), event()])).resolves.toBe(0);
    expect(await WhatsappDemoSessionModel.countDocuments()).toBe(0);
  });

  it('passes on any other failure', async () => {
    jest
      .spyOn(WhatsappDemoEventModel, 'insertMany')
      .mockRejectedValueOnce({ writeErrors: [{ code: 121 }] });
    await expect(recordEvents(asha, [event()])).rejects.toEqual({ writeErrors: [{ code: 121 }] });
  });

  it('passes on a failure that is not a write error', async () => {
    jest
      .spyOn(WhatsappDemoEventModel, 'insertMany')
      .mockRejectedValueOnce(new Error('connection lost'));
    await expect(recordEvents(asha, [event()])).rejects.toThrow('connection lost');
  });
});
