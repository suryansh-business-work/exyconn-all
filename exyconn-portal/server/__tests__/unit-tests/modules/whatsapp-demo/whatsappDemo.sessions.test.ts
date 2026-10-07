import {
  funnel,
  sessionDetail,
  sessions,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.sessions';
import {
  WhatsappDemoEventModel,
  WhatsappDemoSessionModel,
  type WhatsappEventType,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.analytics.model';
import { WhatsappWorkflowModel } from '../../../../src/modules/whatsapp-demo/whatsappDemo.model';
import type { TableQueryInput } from '../../../../src/utils/tableQuery';

const MINUTE = 60_000;
const page: TableQueryInput = { page: 0, pageSize: 20 };

const session = (sessionId: string, startedAt: Date, lastEventAt: Date, fields = {}) =>
  WhatsappDemoSessionModel.create({
    sessionId,
    userId: `user-${sessionId}`,
    userName: `Person ${sessionId}`,
    userEmail: `${sessionId}@example.com`,
    startedAt,
    lastEventAt,
    durationMs: lastEventAt.getTime() - startedAt.getTime(),
    ...fields,
  });

const step = (
  sessionId: string,
  at: string,
  node: string | null,
  type: WhatsappEventType = 'STEP',
) =>
  WhatsappDemoEventModel.create({
    eventId: `${sessionId}-${at}-${node ?? 'start'}`,
    sessionId,
    userId: `user-${sessionId}`,
    type,
    at: new Date(at),
    demoKey: 'salon',
    workflow: 'booking',
    node,
  });

describe('the sessions grid', () => {
  beforeEach(async () => {
    const now = Date.now();
    await session('live', new Date(now - 10 * MINUTE), new Date(now - MINUTE), {
      device: 'mobile',
    });
    await session('idle', new Date(now - 120 * MINUTE), new Date(now - 90 * MINUTE), {
      device: 'desktop',
    });
    await session(
      'old',
      new Date('2026-01-10T10:00:00.000Z'),
      new Date('2026-01-10T10:20:00.000Z'),
    );
  });

  it('lists every session, newest first, with its computed status', async () => {
    const result = await sessions(page);
    expect(result.totalCount).toBe(3);
    expect(result.rows.map((row) => row.sessionId)).toEqual(['live', 'idle', 'old']);
    expect(result.rows.map((row) => row.status)).toEqual(['active', 'ended', 'ended']);
  });

  it('filters by the computed status', async () => {
    const active = await sessions({
      ...page,
      filters: [{ field: 'status', op: 'EQUALS', value: 'active' }],
    });
    expect(active.rows.map((row) => row.sessionId)).toEqual(['live']);
    const ended = await sessions({
      ...page,
      filters: [{ field: 'status', op: 'EQUALS', value: 'ended' }],
    });
    expect(ended.rows.map((row) => row.sessionId)).toEqual(['idle', 'old']);
  });

  it('ignores an unknown status and keeps the other filters', async () => {
    const result = await sessions({
      ...page,
      filters: [
        { field: 'status', op: 'EQUALS', value: 'paused' },
        { field: 'device', op: 'EQUALS', value: 'desktop' },
      ],
    });
    expect(result.rows.map((row) => row.sessionId)).toEqual(['idle']);
  });

  it('confines the list to a date range when both ends are given', async () => {
    const result = await sessions(page, '2026-01-10', '2026-01-10');
    expect(result.rows.map((row) => row.sessionId)).toEqual(['old']);
    expect((await sessions(page, '2026-01-10', null)).totalCount).toBe(3);
  });

  it('refuses a range whose end is before its start', async () => {
    await expect(sessions(page, '2026-02-01', '2026-01-01')).rejects.toThrow(
      'Choose a valid date range.',
    );
  });
});

describe("one session's detail", () => {
  it('is null for a session that does not exist', async () => {
    await expect(sessionDetail('nobody')).resolves.toBeNull();
  });

  it('carries the session and its events in order', async () => {
    await session(
      's-1',
      new Date('2026-10-01T10:00:00.000Z'),
      new Date('2026-10-01T10:05:00.000Z'),
    );
    await step('s-1', '2026-10-01T10:05:00.000Z', 'done');
    await step('s-1', '2026-10-01T10:00:00.000Z', null, 'FLOW_STARTED');
    await step('s-2', '2026-10-01T10:01:00.000Z', 'elsewhere');
    const detail = await sessionDetail('s-1');
    expect(detail?.session).toMatchObject({ sessionId: 's-1', durationMs: 5 * MINUTE });
    expect(detail?.events.map((event) => event.type)).toEqual(['FLOW_STARTED', 'STEP']);
  });
});

describe("a workflow's funnel", () => {
  const graph = (header: string) => ({
    start: 'menu',
    nodes: [
      { id: 'menu', type: 'buttons', data: { header, text: 'Pick a service' } },
      { id: 'ask', type: 'input', data: { prompt: 'Your name?' } },
      { id: 'note', type: 'text', data: { text: 'Thanks! '.repeat(20) } },
      { id: 'done', type: 'end', data: {} },
    ],
    edges: [],
  });

  beforeEach(async () => {
    await step('a', '2026-10-01T10:00:00.000Z', null, 'FLOW_STARTED');
    await step('a', '2026-10-01T10:01:00.000Z', 'menu');
    await step('a', '2026-10-01T10:02:00.000Z', 'ask');
    await step('b', '2026-10-01T11:00:00.000Z', null, 'FLOW_STARTED');
    await step('b', '2026-10-01T11:01:00.000Z', 'menu');
    await step('b', '2026-10-01T11:01:30.000Z', 'menu');
    await step('b', '2026-10-01T11:03:00.000Z', 'note');
    await step('b', '2026-10-01T11:04:00.000Z', 'done');
    await step('b', '2026-10-01T11:05:00.000Z', 'gone');
    await step('c', '2026-10-01T11:06:00.000Z', 'menu', 'FLOW_COMPLETED');
  });

  it('counts distinct sessions per node in order of first reach, labelled from the published graph', async () => {
    await WhatsappWorkflowModel.create({
      demoId: 'demo-1',
      demoKey: 'salon',
      key: 'booking',
      name: 'Book',
      draft: graph('Draft header'),
      published: graph('Live header'),
      version: 1,
    });
    const rows = await funnel('salon', 'booking', '2026-10-01', '2026-10-01');
    expect(rows).toEqual([
      { node: '$start', label: '$start', sessions: 2 },
      { node: 'menu', label: 'Live header', sessions: 2 },
      { node: 'ask', label: 'Your name?', sessions: 1 },
      { node: 'note', label: 'Thanks! '.repeat(20).slice(0, 60), sessions: 1 },
      { node: 'done', label: 'end', sessions: 1 },
      { node: 'gone', label: 'gone', sessions: 1 },
    ]);
  });

  it('reads the draft when nothing is published yet', async () => {
    await WhatsappWorkflowModel.create({
      demoId: 'demo-1',
      demoKey: 'salon',
      key: 'booking',
      name: 'Book',
      draft: graph('Draft header'),
    });
    const rows = await funnel('salon', 'booking', '2026-10-01', '2026-10-01');
    expect(rows.find((row) => row.node === 'menu')?.label).toBe('Draft header');
  });

  it('falls back to node ids when the workflow is gone', async () => {
    const rows = await funnel('salon', 'booking', '2026-10-01', '2026-10-01');
    expect(rows.find((row) => row.node === 'menu')?.label).toBe('menu');
  });

  it('is empty outside the range', async () => {
    await expect(funnel('salon', 'booking', '2026-09-01', '2026-09-02')).resolves.toEqual([]);
  });
});
