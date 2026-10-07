import type { FilterQuery } from 'mongoose';
import type { WaGraph } from '@exyconn/wa-flow';
import {
  WhatsappDemoEventModel,
  WhatsappDemoSessionModel,
  type WhatsappDemoSessionDocument,
} from './whatsappDemo.analytics.model';
import { WhatsappWorkflowModel } from './whatsappDemo.model';
import { SESSION_IDLE_MS, presentEvent, presentSession } from './whatsappDemo.present';
import { optionalRange, parseRange } from './whatsappDemo.range';
import { companyTimezone } from './whatsappDemo.zone';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';

/** The most events one session's detail returns. */
const DETAIL_EVENT_LIMIT = 2000;
/** What reaching a node with no readable text is called in the funnel. */
const START_NODE = '$start';

const SESSIONS_TABLE: TableConfig = {
  searchFields: ['userName', 'userEmail'],
  filterFields: ['demos', 'device'],
  sortFields: [
    'startedAt',
    'lastEventAt',
    'durationMs',
    'events',
    'flowsStarted',
    'flowsCompleted',
  ],
  defaultSort: { field: 'startedAt', dir: 'DESC' },
};

/**
 * `status` is computed (an event in the last 30 minutes), so its filter becomes a condition on
 * `lastEventAt` here, and the rest go to the shared table engine.
 */
function statusFilter(input: TableQueryInput): FilterQuery<WhatsappDemoSessionDocument> {
  const status = input.filters?.find((filter) => filter.field === 'status')?.value;
  const cutoff = new Date(Date.now() - SESSION_IDLE_MS);
  if (status === 'active') {
    return { lastEventAt: { $gte: cutoff } };
  }
  if (status === 'ended') {
    return { lastEventAt: { $lt: cutoff } };
  }
  return {};
}

export async function sessions(input: TableQueryInput, from?: string | null, to?: string | null) {
  const range = optionalRange(from, to, await companyTimezone());
  const base: FilterQuery<WhatsappDemoSessionDocument> = {
    ...statusFilter(input),
    ...(range ? { startedAt: { $gte: range.from, $lt: range.to } } : {}),
  };
  const rest = { ...input, filters: input.filters?.filter((filter) => filter.field !== 'status') };
  const page = await tableQuery(WhatsappDemoSessionModel, rest, SESSIONS_TABLE, base);
  const now = Date.now();
  return {
    rows: (page.rows as Parameters<typeof presentSession>[0][]).map((row) =>
      presentSession(row, now),
    ),
    totalCount: page.totalCount,
  };
}

export async function sessionDetail(sessionId: string) {
  const session = await WhatsappDemoSessionModel.findOne({ sessionId }).lean();
  if (!session) {
    return null;
  }
  const events = await WhatsappDemoEventModel.find({ sessionId })
    .sort({ at: 1 })
    .limit(DETAIL_EVENT_LIMIT)
    .lean();
  return { session: presentSession(session), events: events.map(presentEvent) };
}

/** A node's own words, for the funnel row: its header, text or prompt, else its type. */
function nodeLabels(graph: WaGraph | null | undefined): Map<string, string> {
  const labels = new Map<string, string>();
  for (const node of graph?.nodes ?? []) {
    const data = node.data as { header?: string; text?: string; prompt?: string };
    const words = data.header ?? data.text ?? data.prompt ?? node.type;
    labels.set(node.id, words.slice(0, 60));
  }
  return labels;
}

/** Distinct sessions reaching each node of one workflow, in order of first reach. */
export async function funnel(demoKey: string, workflow: string, from: string, to: string) {
  const range = parseRange(from, to, await companyTimezone());
  const [rows, definition] = await Promise.all([
    WhatsappDemoEventModel.aggregate<{ _id: string; sessions: number; firstAt: Date }>([
      {
        $match: {
          demoKey,
          workflow,
          type: { $in: ['FLOW_STARTED', 'STEP'] },
          at: { $gte: range.from, $lt: range.to },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$node', { $literal: START_NODE }] },
          sessions: { $addToSet: '$sessionId' },
          firstAt: { $min: '$at' },
        },
      },
      { $project: { firstAt: 1, sessions: { $size: '$sessions' } } },
      { $sort: { firstAt: 1 } },
      { $limit: 300 },
    ]),
    WhatsappWorkflowModel.findOne({ demoKey, key: workflow }).select('published draft').lean(),
  ]);
  const labels = nodeLabels((definition?.published ?? definition?.draft) as WaGraph | undefined);
  return rows.map((row) => ({
    node: row._id,
    label: labels.get(row._id) ?? row._id,
    sessions: row.sessions,
  }));
}
