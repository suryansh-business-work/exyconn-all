import {
  WhatsappDemoEventType,
  WhatsappWorkflowStatus,
  type WhatsappChannelQuery,
  type WhatsappDemoSessionQuery,
} from '@exyconn/shell/graphql/generated';
import type { WaGraph } from '@exyconn/wa-flow';
import type { DemoStats } from '../../../src/admin/analytics/analytics.data';
import type { SessionRow } from '../../../src/admin/sessions/session.columns';
import type { DemoRow, WorkflowRow } from '../../../src/admin/workflows/model/api';
import type { WhatsappChannelRow } from '../../../src/admin/channel/forms/whatsapp-number';

type DemoEvent = NonNullable<WhatsappDemoSessionQuery['whatsappDemoSession']>['events'][number];
export type ChannelSettings = WhatsappChannelQuery['whatsappChannel'];

/** A two-node graph: a text greeting wired to an end node. */
export const SAMPLE_GRAPH: WaGraph = {
  start: 'text-1',
  nodes: [
    { id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: { text: 'Hello' } },
    { id: 'end-2', type: 'end', position: { x: 0, y: 120 }, data: { showMenu: true } },
  ],
  edges: [{ id: 'text-1--next', source: 'text-1', sourceHandle: 'next', target: 'end-2' }],
} as unknown as WaGraph;

export function workflowRow(overrides: Partial<WorkflowRow> = {}): WorkflowRow {
  return {
    id: 'wf-1',
    demoId: 'demo-1',
    demoKey: 'clinic',
    key: 'book-visit',
    name: 'Book a visit',
    description: 'Books an appointment',
    keywords: ['book'],
    order: 2,
    status: WhatsappWorkflowStatus.Draft,
    version: 1,
    draft: SAMPLE_GRAPH,
    published: null,
    publishedAt: null,
    updatedAt: '2026-10-01T10:00:00.000Z',
    updatedByName: 'Asha',
    ...overrides,
  };
}

export function demoRow(overrides: Partial<DemoRow> = {}): DemoRow {
  return {
    id: 'demo-1',
    key: 'clinic',
    industry: 'Healthcare',
    business: { name: 'City Clinic' },
    greeting: 'Welcome',
    menuText: 'Pick one',
    menuButton: 'Menu',
    order: 1,
    active: true,
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export function demoStats(overrides: Partial<DemoStats> = {}): DemoStats {
  return {
    sessions: 12,
    uniqueUsers: 9,
    flowsStarted: 20,
    flowsCompleted: 15,
    completionRate: 0.75,
    avgSessionMs: 45_000,
    topDemos: [{ key: 'clinic', label: 'Healthcare', count: 7 }],
    devices: [{ key: 'phone', label: 'Phone', count: 10 }],
    daily: [{ date: '2026-10-01', sessions: 4, flowsStarted: 3, flowsCompleted: 2 }],
    flows: [
      {
        demoKey: 'clinic',
        workflow: 'book-visit',
        name: 'Book a visit',
        started: 10,
        completed: 5,
        abandoned: 5,
      },
      {
        demoKey: 'salon',
        workflow: 'haircut',
        name: 'Haircut',
        started: 20,
        completed: 20,
        abandoned: 0,
      },
    ],
    ai: { calls: 8, failures: 2, avgLatencyMs: 1200, tokens: 300 },
    ...overrides,
  };
}

export function sessionRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: 'row-1',
    sessionId: 'sess-1',
    userId: 'user-1',
    userName: 'Ravi Kumar',
    userEmail: 'ravi@example.com',
    startedAt: '2026-10-01T09:00:00.000Z',
    lastEventAt: '2026-10-01T09:05:00.000Z',
    durationMs: 300_000,
    device: 'phone',
    viewport: '390x844',
    demos: ['clinic'],
    flowsStarted: 2,
    flowsCompleted: 1,
    events: 6,
    status: 'ended',
    ...overrides,
  };
}

export function demoEvent(overrides: Partial<DemoEvent> = {}): DemoEvent {
  return {
    id: 'ev-1',
    type: WhatsappDemoEventType.Step,
    at: '2026-10-01T09:01:00.000Z',
    demoKey: null,
    workflow: null,
    node: null,
    stepKind: null,
    label: null,
    durationMs: null,
    meta: null,
    ...overrides,
  };
}

export function channelRow(overrides: Partial<WhatsappChannelRow> = {}): WhatsappChannelRow {
  return {
    id: 'ch-1',
    phoneNumberId: '1234567890',
    displayPhone: '+1 555 010 0000',
    verifyToken: 'verify-token-123',
    enabled: true,
    hasAccessToken: true,
    accessTokenHint: '…abcd',
    hasAppSecret: true,
    webhookUrl: 'https://api.example.com/whatsapp/webhook',
    updatedAt: null,
    updatedByName: null,
    ...overrides,
  };
}
