import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { StatusMonitorModel } from './status-monitor.model';
import { StatusDailyModel } from './status-daily.model';
import { StatusIncidentModel } from './status-incident.model';
import { announceIncident } from './status.alerts';
import { MONITOR_AUTHOR, type StatusState } from './status.constants';

/** Outcome of a single HTTP probe. */
export interface ProbeResult {
  state: StatusState;
  responseMs: number;
  httpStatus: number;
  error: string;
}

/** The UTC calendar day a check belongs to, as `YYYY-MM-DD`. */
export function dayKey(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** Classifies a reachable endpoint: slow but answering is degraded, not down. */
function stateFor(ok: boolean, responseMs: number): StatusState {
  if (!ok) {
    return 'DOWN';
  }
  return responseMs > env.status.degradedMs ? 'DEGRADED' : 'OPERATIONAL';
}

/**
 * Fetches one URL with a hard timeout and reports what happened. Never throws — an
 * unreachable host is a result, not an error, and one bad target must not stop the run.
 */
export async function probe(url: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), env.status.timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'exyconn-status-monitor' },
    });
    const responseMs = Date.now() - startedAt;
    return {
      state: stateFor(response.ok, responseMs),
      responseMs,
      httpStatus: response.status,
      error: response.ok ? '' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      state: 'DOWN',
      responseMs: Date.now() - startedAt,
      httpStatus: 0,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/** Folds one probe into the monitor's day bucket (created on the day's first check). */
async function recordDay(serviceKey: string, result: ProbeResult, at: Date): Promise<void> {
  await StatusDailyModel.updateOne(
    { serviceKey, date: dayKey(at) },
    {
      $inc: {
        checks: 1,
        failures: result.state === 'DOWN' ? 1 : 0,
        degraded: result.state === 'DEGRADED' ? 1 : 0,
        totalResponseMs: result.responseMs,
      },
      $max: { maxResponseMs: result.responseMs },
    },
    { upsert: true },
  );
}

/** Everything the incident logic needs to know about one monitor. */
interface MonitorTarget {
  key: string;
  name: string;
  url: string;
}

/** A timeline entry written by the probe loop rather than a person. */
function monitorUpdate(status: 'INVESTIGATING' | 'RESOLVED', body: string, at: Date) {
  return { status, body, authorName: MONITOR_AUTHOR, createdAt: at };
}

/**
 * Opens an incident once a service has failed `STATUS_FAILURES_TO_OPEN` probes in a
 * row, and closes it on the first healthy one. The team is told either way.
 */
async function syncIncident(
  monitor: MonitorTarget,
  result: ProbeResult,
  consecutiveFailures: number,
  at: Date,
): Promise<void> {
  const open = await StatusIncidentModel.findOne({ serviceKey: monitor.key, resolvedAt: null });
  if (result.state === 'DOWN') {
    if (!open && consecutiveFailures >= env.status.failuresToOpen) {
      const reason = result.error || 'no response';
      await StatusIncidentModel.create({
        serviceKey: monitor.key,
        serviceName: monitor.name,
        title: `${monitor.name} is down`,
        source: 'MONITOR',
        impact: 'MAJOR',
        affectedServiceKeys: [monitor.key],
        state: 'DOWN',
        reason: result.error,
        updates: [monitorUpdate('INVESTIGATING', `Failed checks: ${reason}`, at)],
        startedAt: at,
      });
      await announceIncident('OPENED', monitor, result.error);
    }
    return;
  }
  if (open) {
    await StatusIncidentModel.updateOne(
      { _id: open._id },
      {
        resolvedAt: at,
        $push: { updates: monitorUpdate('RESOLVED', 'The service is answering again.', at) },
      },
    );
    await announceIncident('RESOLVED', monitor, result.error);
  }
}

/**
 * Probes one monitor and writes the live state, the day bucket and any incident change.
 * The failure streak is kept on the monitor row so a restart between two probes does
 * not forget how long a service has been failing.
 */
async function checkMonitor(monitor: MonitorTarget): Promise<void> {
  const at = new Date();
  const result = await probe(monitor.url);
  const failed = result.state === 'DOWN';
  const updated = await StatusMonitorModel.findOneAndUpdate(
    { key: monitor.key },
    {
      state: result.state,
      lastCheckedAt: at,
      lastResponseMs: result.responseMs,
      lastHttpStatus: result.httpStatus,
      lastError: result.error,
      ...(failed ? { $inc: { consecutiveFailures: 1 } } : { consecutiveFailures: 0 }),
    },
    { new: true },
  )
    .select('consecutiveFailures')
    .lean();
  await recordDay(monitor.key, result, at);
  await syncIncident(monitor, result, updated?.consecutiveFailures ?? 0, at);
}

/** Probes every active monitor once, in parallel. Exported so tests can drive one round. */
export async function runStatusChecks(): Promise<number> {
  const monitors = await StatusMonitorModel.find({ isActive: true }).select('key name url').lean();
  await Promise.all(monitors.map((monitor) => checkMonitor(monitor)));
  return monitors.length;
}

/**
 * Starts the recurring probe loop. Runs one round immediately so a freshly deployed
 * status page has data within seconds, then every `STATUS_CHECK_INTERVAL_MS`.
 */
export function startStatusMonitor(): void {
  if (!env.status.enabled) {
    logger.info('Status monitor disabled (STATUS_MONITOR_ENABLED=false)');
    return;
  }
  const round = () => {
    runStatusChecks()
      .then((count) => logger.debug(`Status monitor checked ${count} services`))
      .catch((error: unknown) => logger.error(error, 'Status monitor round failed'));
  };
  round();
  globalThis.setInterval(round, env.status.intervalMs).unref();
  logger.info(`Status monitor started (every ${Math.round(env.status.intervalMs / 1000)}s)`);
}
