import { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import type { SslCertificateRow } from '../../../../../src/pages/security/ssl/ssl.types';

/** One host's certificate as the report returns it, keyed by host as the page keys it. */
export function certificate(
  host: string,
  status: SslCertificateStatus,
  daysLeft: number | null,
  overrides: Partial<SslCertificateRow> = {},
): SslCertificateRow {
  return {
    id: host,
    host,
    monitors: [`${host} monitor`],
    status,
    subject: host,
    altNames: [host, `www.${host}`],
    issuer: "Let's Encrypt (R11)",
    validFrom: daysLeft === null ? null : '2026-08-01T00:00:00.000Z',
    validTo: daysLeft === null ? null : '2026-12-01T00:00:00.000Z',
    daysLeft,
    serialNumber: '0A1B2C',
    fingerprint256: 'AA:BB:CC:DD',
    protocol: daysLeft === null ? '' : 'TLSv1.3',
    authorized: status === SslCertificateStatus.Ok,
    error: '',
    checkedAt: '2026-10-04T08:00:00.000Z',
    ...overrides,
  };
}

/** A report over the four kinds of host the screen distinguishes. */
export const CERTIFICATES: SslCertificateRow[] = [
  certificate('portal.exyconn.com', SslCertificateStatus.Ok, 80),
  certificate('hr.exyconn.com', SslCertificateStatus.Expiring, 12),
  certificate('old.exyconn.com', SslCertificateStatus.Expired, -3, { error: 'CERT_HAS_EXPIRED' }),
  certificate('bad.exyconn.com', SslCertificateStatus.Invalid, 40, { error: 'SELF_SIGNED' }),
  certificate('gone.exyconn.com', SslCertificateStatus.Unreachable, null, {
    error: 'ECONNREFUSED',
  }),
];
