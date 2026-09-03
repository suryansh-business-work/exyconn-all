import { StatusMonitorModel } from './status-monitor.model';
import { StatusDailyModel, type StatusDailyDocument } from './status-daily.model';
import { StatusIncidentModel } from './status-incident.model';
import { dayKey } from './status.monitor';
import { env } from '../../config/env';
import type { StatusState } from './status.constants';

/** One day of a service's history, as the status page draws it. */
export interface StatusDayPoint {
  date: string;
  uptimePercent: number;
  avgResponseMs: number;
  checks: number;
  failures: number;
}

interface DayTotals {
  checks: number;
  failures: number;
  totalResponseMs: number;
}

/** Longest window the page may ask for, so one query can never scan the whole history. */
const MAX_DAYS = 90;
const DEFAULT_DAYS = 90;
const INCIDENT_LIMIT = 20;

/** The last `days` UTC calendar days, oldest first. */
export function dayKeysBack(days: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() - offset),
    );
    keys.push(dayKey(day));
  }
  return keys;
}

/** Successful checks as a percentage. A day with no checks reports 0 alongside `checks: 0`. */
function uptimeOf({ checks, failures }: DayTotals): number {
  if (checks === 0) {
    return 0;
  }
  return Math.round(((checks - failures) / checks) * 1000) / 10;
}

function averageOf({ checks, totalResponseMs }: DayTotals): number {
  return checks === 0 ? 0 : Math.round(totalResponseMs / checks);
}

const emptyTotals = (): DayTotals => ({ checks: 0, failures: 0, totalResponseMs: 0 });

function addTotals(into: DayTotals, from: DayTotals): DayTotals {
  return {
    checks: into.checks + from.checks,
    failures: into.failures + from.failures,
    totalResponseMs: into.totalResponseMs + from.totalResponseMs,
  };
}

function toPoint(date: string, totals: DayTotals): StatusDayPoint {
  return {
    date,
    uptimePercent: uptimeOf(totals),
    avgResponseMs: averageOf(totals),
    checks: totals.checks,
    failures: totals.failures,
  };
}

/** Indexes the stored rollups as `serviceKey -> date -> totals` for O(1) lookup per cell. */
function indexRollups(rows: StatusDailyDocument[]): Map<string, Map<string, DayTotals>> {
  const byService = new Map<string, Map<string, DayTotals>>();
  for (const row of rows) {
    const byDate = byService.get(row.serviceKey) ?? new Map<string, DayTotals>();
    byDate.set(row.date, {
      checks: row.checks,
      failures: row.failures,
      totalResponseMs: row.totalResponseMs,
    });
    byService.set(row.serviceKey, byDate);
  }
  return byService;
}

/** Sums a run of day totals — used for the 24-hour and 30-day uptime figures. */
function sumDays(points: StatusDayPoint[], totals: Map<string, DayTotals>): DayTotals {
  return points.reduce(
    (acc, point) => addTotals(acc, totals.get(point.date) ?? emptyTotals()),
    emptyTotals(),
  );
}

/** The worst state among the monitors, which is what the page's headline reports. */
function overallState(states: StatusState[]): StatusState {
  if (states.length === 0 || states.every((state) => state === 'UNKNOWN')) {
    return 'UNKNOWN';
  }
  if (states.includes('DOWN')) {
    return 'DOWN';
  }
  return states.includes('DEGRADED') ? 'DEGRADED' : 'OPERATIONAL';
}

function clampDays(days?: number | null): number {
  const requested = days ?? DEFAULT_DAYS;
  return Math.min(MAX_DAYS, Math.max(1, Math.trunc(requested)));
}

/**
 * Everything the public status page renders, in one read: each service with its live
 * state and day-by-day history, the platform-wide daily series behind the charts, the
 * recent incidents, and the summary numbers above them.
 */
export async function getStatusOverview(days?: number | null) {
  const window = clampDays(days);
  const dates = dayKeysBack(window);
  const [monitors, rollups, incidents] = await Promise.all([
    StatusMonitorModel.find({ isActive: true }).sort({ order: 1 }).lean(),
    StatusDailyModel.find({ date: { $gte: dates[0] } }).lean(),
    StatusIncidentModel.find().sort({ startedAt: -1 }).limit(INCIDENT_LIMIT).lean(),
  ]);

  const byService = indexRollups(rollups as StatusDailyDocument[]);
  const platform = new Map(dates.map((date) => [date, emptyTotals()]));

  const services = monitors.map((monitor) => {
    const totals = byService.get(monitor.key) ?? new Map<string, DayTotals>();
    const points = dates.map((date) => {
      const day = totals.get(date) ?? emptyTotals();
      platform.set(date, addTotals(platform.get(date) ?? emptyTotals(), day));
      return toPoint(date, day);
    });
    const last30 = points.slice(-30);
    return {
      id: String(monitor._id),
      key: monitor.key,
      name: monitor.name,
      description: monitor.description,
      category: monitor.category,
      url: monitor.url,
      state: monitor.state,
      responseMs: monitor.lastResponseMs,
      lastCheckedAt: monitor.lastCheckedAt,
      lastError: monitor.lastError,
      uptimeToday: uptimeOf(totals.get(dates[dates.length - 1]) ?? emptyTotals()),
      uptime30d: uptimeOf(sumDays(last30, totals)),
      days: points,
    };
  });

  const daily = dates.map((date) => toPoint(date, platform.get(date) ?? emptyTotals()));
  const today = platform.get(dates[dates.length - 1]) ?? emptyTotals();
  const last30 = dates
    .slice(-30)
    .reduce((acc, date) => addTotals(acc, platform.get(date) ?? emptyTotals()), emptyTotals());
  const states = services.map((service) => service.state as StatusState);

  return {
    state: overallState(states),
    generatedAt: new Date(),
    checkIntervalMinutes: Math.max(1, Math.round(env.status.intervalMs / 60_000)),
    total: services.length,
    operational: states.filter((state) => state === 'OPERATIONAL').length,
    degraded: states.filter((state) => state === 'DEGRADED').length,
    down: states.filter((state) => state === 'DOWN').length,
    uptimeToday: uptimeOf(today),
    uptime30d: uptimeOf(last30),
    avgResponseMs: averageOf(today),
    services,
    daily,
    incidents: incidents.map((incident) => ({
      ...incident,
      id: String(incident._id),
      durationMinutes: incidentMinutes(incident.startedAt, incident.resolvedAt),
    })),
  };
}

/** Minutes an incident lasted; measured against now while it is still open. */
function incidentMinutes(startedAt: Date, resolvedAt?: Date | null): number {
  const end = resolvedAt ? resolvedAt.getTime() : Date.now();
  return Math.max(0, Math.round((end - startedAt.getTime()) / 60_000));
}
