import { statCount } from '@exyconn/shell/components/data/tableStats';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { HEALTHY_STATE, OPEN_PROBLEM_STATUSES } from './tech-overview.constants';

/** A service the status checker has an opinion about. */
interface ServiceHealth {
  state: string;
}

/** Reports nobody has closed yet, summed across the states that count as open. */
export function openProblemReports(stats: TableStatsShape | null | undefined): number {
  return OPEN_PROBLEM_STATUSES.reduce(
    (total, status) => total + statCount(stats, 'status', status),
    0,
  );
}

/** Services that are down, degraded or unknown — the ones worth looking at first. */
export function unhealthyServices<T extends ServiceHealth>(services: readonly T[]): T[] {
  return services.filter((service) => service.state !== HEALTHY_STATE);
}

/** Whole-percent uptime, the precision a dashboard is actually read at. */
export function uptimeLabel(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
