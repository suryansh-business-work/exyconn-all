import { stats } from '../../../../src/modules/whatsapp-demo/whatsappDemo.stats';
import {
  WhatsappDemoEventModel,
  WhatsappDemoSessionModel,
  type WhatsappEventType,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';
import {
  WhatsappDemoModel,
  WhatsappWorkflowModel,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';

let sequence = 0;
const nextId = () => {
  sequence += 1;
  return sequence;
};

const session = (userId: string, startedAt: string, durationMs: number, device: string | null) =>
  WhatsappDemoSessionModel.create({
    sessionId: `s-${nextId()}`,
    userId,
    startedAt: new Date(startedAt),
    lastEventAt: new Date(new Date(startedAt).getTime() + durationMs),
    durationMs,
    device,
  });

const event = (
  type: WhatsappEventType,
  at: string,
  fields: {
    demoKey?: string | null;
    workflow?: string | null;
    meta?: Record<string, unknown>;
  } = {},
) =>
  WhatsappDemoEventModel.create({
    eventId: `e-${nextId()}`,
    sessionId: 's-1',
    userId: 'u-1',
    type,
    at: new Date(at),
    ...fields,
  });

describe('the WhatsApp demo analytics', () => {
  it('is all zeros, with an empty day for each day, when nothing happened', async () => {
    const result = await stats('2026-10-01', '2026-10-02');
    expect(result).toEqual({
      sessions: 0,
      uniqueUsers: 0,
      flowsStarted: 0,
      flowsCompleted: 0,
      completionRate: 0,
      avgSessionMs: 0,
      topDemos: [],
      devices: [],
      daily: [
        { date: '2026-10-01', sessions: 0, flowsStarted: 0, flowsCompleted: 0 },
        { date: '2026-10-02', sessions: 0, flowsStarted: 0, flowsCompleted: 0 },
      ],
      flows: [],
      ai: { calls: 0, failures: 0, avgLatencyMs: 0, tokens: 0 },
    });
  });

  it('refuses a range that is not valid', async () => {
    await expect(stats('2026-10-05', '2026-10-01')).rejects.toThrow('Choose a valid date range.');
  });

  it('adds up sessions, users, devices and days on the company clock', async () => {
    await session('u-1', '2026-10-01T05:00:00.000Z', 60_000, 'mobile');
    await session('u-1', '2026-10-01T20:00:00.000Z', 120_000, 'mobile');
    await session('u-2', '2026-10-02T06:00:00.000Z', 30_001, null);
    await session('u-3', '2026-09-20T06:00:00.000Z', 999_000, 'desktop');

    const result = await stats('2026-10-01', '2026-10-02');
    expect(result.sessions).toBe(3);
    expect(result.uniqueUsers).toBe(2);
    expect(result.avgSessionMs).toBe(70_000);
    expect(result.devices).toEqual([
      { key: 'mobile', label: 'mobile', count: 2 },
      { key: 'unknown', label: 'unknown', count: 1 },
    ]);
    // 20:00 UTC on the 1st is already the 2nd in Kolkata.
    expect(result.daily.map((day) => day.sessions)).toEqual([1, 2]);
  });

  it('reports flows per workflow by name, the completion rate and the top demos', async () => {
    await WhatsappDemoModel.create({
      key: 'salon',
      industry: 'Salon & Spa',
      business: { name: 'Glow' },
      greeting: 'Hi',
      menuText: 'Menu',
      menuButton: 'Open',
    });
    await WhatsappWorkflowModel.create({
      demoId: 'd-1',
      demoKey: 'salon',
      key: 'booking',
      name: 'Book a slot',
      draft: { start: 'end' },
    });
    const salon = { demoKey: 'salon', workflow: 'booking' };
    await event('FLOW_STARTED', '2026-10-01T06:00:00.000Z', salon);
    await event('FLOW_STARTED', '2026-10-01T07:00:00.000Z', salon);
    await event('FLOW_COMPLETED', '2026-10-01T08:00:00.000Z', salon);
    await event('FLOW_ABANDONED', '2026-10-01T09:00:00.000Z', salon);
    await event('FLOW_STARTED', '2026-10-02T06:00:00.000Z', {
      demoKey: 'clinic',
      workflow: 'visit',
    });
    await event('FLOW_ABANDONED', '2026-10-02T07:00:00.000Z', { demoKey: null, workflow: null });
    await event('DEMO_OPENED', '2026-10-01T05:00:00.000Z', { demoKey: 'salon' });
    await event('DEMO_OPENED', '2026-10-01T05:30:00.000Z', { demoKey: 'salon' });
    await event('DEMO_OPENED', '2026-10-01T05:40:00.000Z', { demoKey: 'clinic' });
    await event('DEMO_OPENED', '2026-10-01T05:50:00.000Z', { demoKey: null });

    const result = await stats('2026-10-01', '2026-10-02');
    expect(result.flows).toEqual([
      {
        demoKey: 'salon',
        workflow: 'booking',
        name: 'Book a slot',
        started: 2,
        completed: 1,
        abandoned: 1,
      },
      {
        demoKey: 'clinic',
        workflow: 'visit',
        name: 'visit',
        started: 1,
        completed: 0,
        abandoned: 0,
      },
      { demoKey: '', workflow: '', name: '', started: 0, completed: 0, abandoned: 1 },
    ]);
    expect(result.flowsStarted).toBe(3);
    expect(result.flowsCompleted).toBe(1);
    expect(result.completionRate).toBeCloseTo(1 / 3);
    expect(result.topDemos[0]).toEqual({ key: 'salon', label: 'Salon & Spa', count: 2 });
    expect(result.topDemos).toEqual(
      expect.arrayContaining([
        { key: 'clinic', label: 'clinic', count: 1 },
        { key: '', label: '', count: 1 },
      ]),
    );
    expect(result.daily).toEqual([
      { date: '2026-10-01', sessions: 0, flowsStarted: 2, flowsCompleted: 1 },
      { date: '2026-10-02', sessions: 0, flowsStarted: 1, flowsCompleted: 0 },
    ]);
  });

  it('never reports a completion rate above one', async () => {
    const flow = { demoKey: 'salon', workflow: 'booking' };
    await event('FLOW_STARTED', '2026-10-01T06:00:00.000Z', flow);
    await event('FLOW_COMPLETED', '2026-10-01T07:00:00.000Z', flow);
    await event('FLOW_COMPLETED', '2026-10-01T08:00:00.000Z', flow);
    expect((await stats('2026-10-01', '2026-10-01')).completionRate).toBe(1);
  });

  it('sums the AI calls, their failures, latency and tokens', async () => {
    await event('AI_CALL', '2026-10-01T06:00:00.000Z', {
      meta: { ok: true, latencyMs: 300, tokens: 40 },
    });
    await event('AI_CALL', '2026-10-01T06:01:00.000Z', {
      meta: { ok: false, latencyMs: 101, tokens: 0 },
    });
    await event('AI_CALL', '2026-10-01T06:02:00.000Z', {
      meta: { ok: true, latencyMs: 200, tokens: 60 },
    });
    const { ai } = await stats('2026-10-01', '2026-10-01');
    expect(ai).toEqual({ calls: 3, failures: 1, avgLatencyMs: 200, tokens: 100 });
  });
});
