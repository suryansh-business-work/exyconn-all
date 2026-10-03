import { env } from '../../config/env';
import { StatusMonitorModel } from '../status/status-monitor.model';
import {
  certificateRow,
  monitorHosts,
  unreachableRow,
  type SslCertificateRow,
  type SslHost,
} from './ssl.certificates';
import { readCertificate } from './ssl.probe';
import { mapWithConcurrency } from './concurrency';

/** How long a report is reused before the hosts are checked again. */
export const SSL_CACHE_TTL_MS = 10 * 60_000;

/** Handshakes in flight at once: enough to finish quickly, few enough not to look like a scan. */
const SSL_CONCURRENCY = 5;

/** What `sslCertificates` returns. */
export interface SslCertificateReport {
  warningDays: number;
  checkedAt: Date;
  certificates: SslCertificateRow[];
}

let cache: { at: number; report: SslCertificateReport } | null = null;

/** Forgets the cached report (tests, and a monitor list that has just changed). */
export function clearSslCache(): void {
  cache = null;
}

/** The https hosts of the active status monitors — the list Tech › Status monitors keeps. */
async function hostsToCheck(): Promise<SslHost[]> {
  const monitors = await StatusMonitorModel.find({ isActive: true })
    .sort({ order: 1 })
    .select('name url')
    .lean();
  return monitorHosts(monitors);
}

/** One host's row. A host that cannot be reached is a row saying so, never an error. */
async function checkHost(host: SslHost, warningDays: number): Promise<SslCertificateRow> {
  try {
    const result = await readCertificate(host.host, env.security.sslTimeoutMs);
    return certificateRow(host, result, warningDays, new Date());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The host could not be reached';
    return unreachableRow(host, message, new Date());
  }
}

/** Every monitored host's certificate, from the cache unless it is stale or `refresh` is set. */
export async function sslCertificates(refresh = false): Promise<SslCertificateReport> {
  if (!refresh && cache && Date.now() - cache.at < SSL_CACHE_TTL_MS) {
    return cache.report;
  }
  const warningDays = env.security.sslWarningDays;
  const hosts = await hostsToCheck();
  const certificates = await mapWithConcurrency(hosts, SSL_CONCURRENCY, (host) =>
    checkHost(host, warningDays),
  );
  const report = { warningDays, checkedAt: new Date(), certificates };
  cache = { at: Date.now(), report };
  return report;
}
