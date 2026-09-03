import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { StatusMonitorModel } from './status-monitor.model';
import { statusTargets } from './status.constants';

/**
 * Makes sure every surface in the catalogue has a monitor row. Only missing keys are
 * inserted: a row an administrator has renamed, re-pointed or deactivated from
 * Tech > Status Monitors is left exactly as they left it.
 */
export async function ensureStatusMonitors(): Promise<number> {
  const targets = statusTargets(env.status.domain, env.trackerDownloadUrl);
  const existing = await StatusMonitorModel.find().select('key').lean();
  const known = new Set(existing.map((monitor) => monitor.key));
  const missing = targets.filter((target) => !known.has(target.key));
  if (missing.length > 0) {
    await StatusMonitorModel.insertMany(missing);
    logger.info(`Status monitor: added ${missing.length} service(s) to the catalogue`);
  }
  return missing.length;
}
