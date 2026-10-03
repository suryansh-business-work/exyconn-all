import { formatDuration } from '@exyconn/shell/pages/tracker-view/tracker.format';

const MINUTE_MS = 60_000;

/**
 * How long a demo session or step lasted: "45s" under a minute, then the portal's shared
 * "1h 30m" form. A demo is often over in seconds, which the shared form would call "0m".
 */
export function formatDemoDuration(ms: number): string {
  if (ms < MINUTE_MS) {
    return `${Math.max(0, Math.round(ms / 1000))}s`;
  }
  return formatDuration(ms);
}
