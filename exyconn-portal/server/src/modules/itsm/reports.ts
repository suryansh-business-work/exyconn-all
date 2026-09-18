import { assertPermission } from '../../lib/permissions';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { SupportTicketModel } from '../employee/support.model';
import { AssetModel } from '../assets/asset.model';
import { ItIncidentModel } from './models';
import { INSIGHTS_MODULE, itOnly } from './dashboard';
import { IN_SERVICE_ASSET, IT_TICKET, OPEN_TICKET } from './itsm.queries';
import { itCostSummary, lastMonths, monthKey, type ItMetric } from './cost';

const MS_PER_HOUR = 3_600_000;
const MIN_MONTHS = 1;
const MAX_MONTHS = 24;

/** Mean of a list, 0 for an empty one — no data is not a reason to fail a report. */
const mean = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Counts rows per value of one field. */
function countBy<T>(rows: T[], pick: (row: T) => string): ItMetric[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(pick(row), (totals.get(pick(row)) ?? 0) + 1);
  }
  return [...totals].map(([label, value]) => ({ label, value }));
}

/** IT tickets in the window: volume per month, resolution time and the SLA. */
async function ticketReport(since: Date, months: string[]) {
  const [tickets, breachedOpen] = await Promise.all([
    SupportTicketModel.find({ ...IT_TICKET, createdAt: { $gte: since } })
      .select('status createdAt resolvedAt dueAt')
      .lean(),
    SupportTicketModel.countDocuments({ ...IT_TICKET, ...OPEN_TICKET, dueAt: { $lt: new Date() } }),
  ]);
  const trend = new Map(months.map((key) => [key, { opened: 0, resolved: 0 }]));
  for (const ticket of tickets) {
    const opened = trend.get(monthKey(ticket.createdAt as Date));
    if (opened) opened.opened += 1;
    const resolved = ticket.resolvedAt ? trend.get(monthKey(ticket.resolvedAt)) : undefined;
    if (resolved) resolved.resolved += 1;
  }
  const resolved = tickets.filter((ticket) => ticket.resolvedAt);
  const promised = resolved.filter((ticket) => ticket.dueAt);
  const met = promised.filter((ticket) => (ticket.resolvedAt as Date) <= (ticket.dueAt as Date));
  return {
    ticketsByStatus: countBy(tickets, (ticket) => ticket.status),
    ticketTrend: [...trend].map(([period, counts]) => ({ period, ...counts })),
    avgResolutionHours: mean(
      resolved.map(
        (t) => ((t.resolvedAt as Date).getTime() - (t.createdAt as Date).getTime()) / MS_PER_HOUR,
      ),
    ),
    slaMetPercent: promised.length === 0 ? 100 : (met.length / promised.length) * 100,
    breachedOpen,
  };
}

/** How much of each kind of device is actually in someone's hands. */
async function assetUtilization() {
  const assets = await AssetModel.find(IN_SERVICE_ASSET).select('category status').lean();
  const byCategory = new Map<string, { total: number; assigned: number }>();
  for (const asset of assets) {
    const row = byCategory.get(asset.category) ?? { total: 0, assigned: 0 };
    row.total += 1;
    row.assigned += asset.status === 'ASSIGNED' ? 1 : 0;
    byCategory.set(asset.category, row);
  }
  return [...byCategory].map(([category, counts]) => ({ category, ...counts }));
}

/** Incidents in the window: how bad, how often, and how long they took to put right. */
async function incidentReport(since: Date, months: string[]) {
  const incidents = await ItIncidentModel.find({ startedAt: { $gte: since } })
    .select('severity startedAt resolvedAt')
    .lean();
  const perMonth = new Map(months.map((key) => [key, 0]));
  for (const incident of incidents) {
    const key = monthKey(incident.startedAt);
    if (perMonth.has(key)) perMonth.set(key, (perMonth.get(key) ?? 0) + 1);
  }
  const resolved = incidents.filter((incident) => incident.resolvedAt);
  return {
    incidentsBySeverity: countBy(incidents, (incident) => incident.severity),
    incidentsByMonth: [...perMonth].map(([label, value]) => ({ label, value })),
    mttrHours: mean(
      resolved.map((i) => ((i.resolvedAt as Date).getTime() - i.startedAt.getTime()) / MS_PER_HOUR),
    ),
  };
}

/** IT › Reports: tickets, assets, incidents and spend over the last `months` months. */
export async function itReport(
  _p: unknown,
  { months }: { months?: number | null },
  ctx: GraphQLContext,
) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  const span = months ?? 6;
  if (!Number.isInteger(span) || span < MIN_MONTHS || span > MAX_MONTHS) {
    badRequest(`A report covers ${MIN_MONTHS} to ${MAX_MONTHS} months`);
  }
  const keys = lastMonths(span);
  const since = new Date(`${keys[0]}-01T00:00:00.000Z`);
  const [tickets, utilization, incidents, spend] = await Promise.all([
    ticketReport(since, keys),
    assetUtilization(),
    incidentReport(since, keys),
    itCostSummary(),
  ]);
  return { months: span, ...tickets, assetUtilization: utilization, ...incidents, spend };
}
