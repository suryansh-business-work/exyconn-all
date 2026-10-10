import type { PipelineStage } from 'mongoose';
import { WhatsappDemoEventModel, WhatsappDemoSessionModel } from './whatsappDemo.analytics.model';
import { WhatsappDemoModel, WhatsappWorkflowModel } from './whatsappDemo.model';
import { companyTimezone } from './whatsappDemo.zone';
import { daysOf, parseRange, type Range } from './whatsappDemo.range';

interface Bucket {
  _id: string | null;
  count: number;
}

interface FlowBucket {
  _id: { demoKey: string; workflow: string; type: string };
  count: number;
}

interface DayBucket {
  _id: { day: string; type: string };
  count: number;
}

interface AiBucket {
  calls: number;
  failures: number;
  latency: number;
  tokens: number;
}

const FLOW_TYPES = ['FLOW_STARTED', 'FLOW_COMPLETED', 'FLOW_ABANDONED'];

/** Session numbers: counts, distinct users, average length, devices and sessions per day. */
async function sessionFacets(range: Range, timeZone: string) {
  const [facets] = await WhatsappDemoSessionModel.aggregate<{
    totals: { sessions: number; avgMs: number }[];
    users: { count: number }[];
    devices: Bucket[];
    daily: Bucket[];
  }>([
    { $match: { startedAt: { $gte: range.from, $lt: range.to } } },
    {
      $facet: {
        totals: [{ $group: { _id: null, sessions: { $sum: 1 }, avgMs: { $avg: '$durationMs' } } }],
        users: [{ $group: { _id: '$userId' } }, { $count: 'count' }],
        devices: [{ $group: { _id: '$device', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        daily: [
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone: timeZone },
              },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);
  return facets;
}

/** Event numbers: demos opened, flow outcomes, flows per day and the AI calls. */
async function eventFacets(range: Range, timeZone: string) {
  const day = { $dateToString: { format: '%Y-%m-%d', date: '$at', timezone: timeZone } };
  const pipeline: PipelineStage[] = [
    { $match: { at: { $gte: range.from, $lt: range.to } } },
    {
      $facet: {
        demos: [
          { $match: { type: 'DEMO_OPENED' } },
          { $group: { _id: '$demoKey', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
        flows: [
          { $match: { type: { $in: FLOW_TYPES } } },
          {
            $group: {
              _id: { demoKey: '$demoKey', workflow: '$workflow', type: '$type' },
              count: { $sum: 1 },
            },
          },
        ],
        daily: [
          { $match: { type: { $in: ['FLOW_STARTED', 'FLOW_COMPLETED'] } } },
          { $group: { _id: { day, type: '$type' }, count: { $sum: 1 } } },
        ],
        ai: [
          { $match: { type: 'AI_CALL' } },
          {
            $group: {
              _id: null,
              calls: { $sum: 1 },
              failures: { $sum: { $cond: [{ $eq: ['$meta.ok', true] }, 0, 1] } },
              latency: { $avg: '$meta.latencyMs' },
              tokens: { $sum: '$meta.tokens' },
            },
          },
        ],
      },
    },
  ];
  const [facets] = await WhatsappDemoEventModel.aggregate<{
    demos: Bucket[];
    flows: FlowBucket[];
    daily: DayBucket[];
    ai: AiBucket[];
  }>(pipeline);
  return facets;
}

/** Names to show beside keys: each demo's business name and each workflow's menu title. */
async function names() {
  const [demos, workflows] = await Promise.all([
    WhatsappDemoModel.find().select('key industry').lean(),
    WhatsappWorkflowModel.find().select('demoKey key name').lean(),
  ]);
  return {
    demo: new Map(demos.map((d) => [d.key, d.industry])),
    workflow: new Map(workflows.map((w) => [`${w.demoKey}/${w.key}`, w.name])),
  };
}

function flowStats(buckets: FlowBucket[], workflowNames: ReadonlyMap<string, string>) {
  const rows = new Map<
    string,
    {
      demoKey: string;
      workflow: string;
      name: string;
      started: number;
      completed: number;
      abandoned: number;
    }
  >();
  for (const { _id, count } of buckets) {
    const id = `${_id.demoKey}/${_id.workflow}`;
    const row = rows.get(id) ?? {
      demoKey: _id.demoKey ?? '',
      workflow: _id.workflow ?? '',
      name: workflowNames.get(id) ?? _id.workflow ?? '',
      started: 0,
      completed: 0,
      abandoned: 0,
    };
    if (_id.type === 'FLOW_STARTED') {
      row.started += count;
    } else if (_id.type === 'FLOW_COMPLETED') {
      row.completed += count;
    } else {
      row.abandoned += count;
    }
    rows.set(id, row);
  }
  return [...rows.values()].sort((a, b) => b.started - a.started);
}

function dailySeries(range: Range, timeZone: string, sessions: Bucket[], flows: DayBucket[]) {
  const sessionsByDay = new Map(sessions.map((b) => [b._id as string, b.count]));
  const flowCount = (day: string, type: string) =>
    flows.find((b) => b._id.day === day && b._id.type === type)?.count ?? 0;
  return daysOf(range, timeZone).map((date) => ({
    date,
    sessions: sessionsByDay.get(date) ?? 0,
    flowsStarted: flowCount(date, 'FLOW_STARTED'),
    flowsCompleted: flowCount(date, 'FLOW_COMPLETED'),
  }));
}

export async function stats(from: string, to: string) {
  const timeZone = await companyTimezone();
  const range = parseRange(from, to, timeZone);
  const [sessions, events, labels] = await Promise.all([
    sessionFacets(range, timeZone),
    eventFacets(range, timeZone),
    names(),
  ]);
  const flows = flowStats(events.flows, labels.workflow);
  const flowsStarted = flows.reduce((sum, row) => sum + row.started, 0);
  const flowsCompleted = flows.reduce((sum, row) => sum + row.completed, 0);
  const ai = events.ai[0];
  return {
    sessions: sessions.totals[0]?.sessions ?? 0,
    uniqueUsers: sessions.users[0]?.count ?? 0,
    flowsStarted,
    flowsCompleted,
    completionRate: flowsStarted > 0 ? Math.min(1, flowsCompleted / flowsStarted) : 0,
    avgSessionMs: Math.round(sessions.totals[0]?.avgMs ?? 0),
    topDemos: events.demos.map((b) => ({
      key: b._id ?? '',
      label: labels.demo.get(b._id ?? '') ?? b._id ?? '',
      count: b.count,
    })),
    devices: sessions.devices.map((b) => ({
      key: b._id ?? 'unknown',
      label: b._id ?? 'unknown',
      count: b.count,
    })),
    daily: dailySeries(range, timeZone, sessions.daily, events.daily),
    flows,
    ai: {
      calls: ai?.calls ?? 0,
      failures: ai?.failures ?? 0,
      avgLatencyMs: Math.round(ai?.latency ?? 0),
      tokens: ai?.tokens ?? 0,
    },
  };
}
