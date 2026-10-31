import { env } from '../../../config/env';
import { ROLES } from '../../../constants/roles';
import { JOB_KEYS, recordJobRun } from '../../../utils/jobHeartbeat';
import { logger } from '../../../utils/logger';
import { slackNotifier } from '../../../utils/slack';
import { UserModel } from '../../admin/user.model';
import { notifyBestEffort } from '../../notifications/notifications.service';
import { forEachOrganization } from '../../organizations';
import { registerBackgroundJob } from '../../tech/jobs.registry';
import { McpCallModel } from './mcp.models';
import { markMcpSettings, mcpSettings, type McpSettings } from './mcp.settings';

/** How often each company's MCP health is checked. */
const TICK_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
/** Refusals by the company's own settings are not failures of the tools. */
const POLICY_CODES = ['RATE_LIMITED', 'TOOL_DISABLED', 'READ_ONLY'];

/** Calls, failures and the p95 time between two moments, refusals by settings left out. */
async function healthBetween(from: Date, to: Date) {
  const rows = await McpCallModel.find({
    at: { $gte: from, $lt: to },
    errorCode: { $nin: POLICY_CODES },
  })
    .select('ok durationMs tool')
    .lean();
  const times = rows.map((row) => row.durationMs ?? 0).sort((a, b) => a - b);
  const failed = rows.filter((row) => !row.ok);
  const byTool = new Map<string, number>();
  for (const row of failed) byTool.set(row.tool, (byTool.get(row.tool) ?? 0) + 1);
  const worst = [...byTool].sort((a, b) => b[1] - a[1])[0];
  return {
    calls: rows.length,
    failures: failed.length,
    errorRate: rows.length === 0 ? 0 : (failed.length / rows.length) * 100,
    p95Ms: times.length === 0 ? 0 : times[Math.ceil(0.95 * times.length) - 1],
    worstTool: worst ? `${worst[0]} (${worst[1]})` : '',
  };
}

/** The MCP portal's error log, where an alert points. */
const errorsLink = () => `${new URL(env.mcp.consentUrl).origin}/mcp/all/errors`;

/** Sends one message to the company's admins (their notifications) and its Slack channel. */
async function raise(settings: McpSettings, title: string, body: string): Promise<void> {
  const admins = await UserModel.find({ roles: ROLES.ADMIN, isActive: true }).select('_id').lean();
  const link = errorsLink();
  await Promise.all(
    admins.map((admin) => notifyBestEffort(String(admin._id), { kind: 'MCP', title, body, link })),
  );
  if (settings.alertSlackChannel) {
    await slackNotifier
      .post(settings.alertSlackChannel, `*${title}*\n${body}\n${link}`)
      .catch((error: unknown) =>
        logger.warn({ err: error }, 'Could not post an MCP alert to Slack'),
      );
  }
}

/** Raises an alert when the last hour broke the company's error-rate or p95 threshold. */
async function checkAlert(settings: McpSettings, now: Date): Promise<boolean> {
  const cooled = !settings.lastAlertAt || now.getTime() - settings.lastAlertAt.getTime() >= HOUR_MS;
  if (!settings.alertsEnabled || !cooled) return false;
  const hour = await healthBetween(new Date(now.getTime() - HOUR_MS), now);
  const failing = hour.errorRate >= settings.alertErrorRatePercent;
  const slow = hour.p95Ms >= settings.alertP95Ms;
  if (hour.calls < settings.alertMinCalls || !(failing || slow)) return false;
  const rate = Math.round(hour.errorRate);
  await raise(
    settings,
    'Claude (MCP) needs a look',
    `Last hour: ${hour.calls} calls, ${hour.failures} failed (${rate}%), slowest 5% over ${hour.p95Ms} ms.` +
      (hour.worstTool ? ` Most failures: ${hour.worstTool}.` : ''),
  );
  await markMcpSettings({ lastAlertAt: now });
  return true;
}

/** Sends yesterday's summary once, when the company asked for a daily digest. */
async function checkDigest(settings: McpSettings, now: Date): Promise<boolean> {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - DAY_MS).toISOString().slice(0, 10);
  if (!settings.dailyDigest || settings.lastDigestDay === yesterday) return false;
  const day = await healthBetween(
    new Date(`${yesterday}T00:00:00Z`),
    new Date(`${today}T00:00:00Z`),
  );
  await markMcpSettings({ lastDigestDay: yesterday });
  if (day.calls === 0) return false;
  await raise(
    settings,
    `Claude (MCP) on ${yesterday}`,
    `${day.calls} calls, ${day.failures} failed (${Math.round(day.errorRate)}%), slowest 5% over ${day.p95Ms} ms.` +
      (day.worstTool ? ` Most failures: ${day.worstTool}.` : ''),
  );
  return true;
}

/**
 * One company's pass: an alert when the last hour failed or slowed past its thresholds (at most
 * one an hour), and yesterday's digest once. Idempotent: the last alert time and the last digest
 * day are stored, so a second pass at the same moment sends nothing.
 */
export async function runMcpAlerts(now = new Date()): Promise<void> {
  const settings = await mcpSettings();
  const [alerted, digested] = [await checkAlert(settings, now), await checkDigest(settings, now)];
  recordJobRun(
    JOB_KEYS.mcpAlerts,
    `Checked MCP health${alerted ? ', alerted' : ''}${digested ? ', sent digest' : ''}`,
  );
}

/** Starts the five-minute MCP health check across every company. */
export function startMcpAlerts(): void {
  const tick = () => {
    forEachOrganization(() => runMcpAlerts(), 'MCP alerts').catch((error: unknown) =>
      logger.error(error, 'MCP alert check failed'),
    );
  };
  globalThis.setInterval(tick, TICK_MS).unref();
  logger.info('MCP alerts started');
}

registerBackgroundJob({
  key: JOB_KEYS.mcpAlerts,
  label: 'Claude (MCP) alerts',
  description:
    'Alerts admins when MCP calls fail or slow past the company thresholds, and sends the daily digest.',
  runOnce: () => runMcpAlerts(),
});
