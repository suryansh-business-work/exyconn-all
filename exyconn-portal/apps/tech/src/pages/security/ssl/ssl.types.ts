import { SslCertificateStatus, type SslCertificatesQuery } from '@exyconn/shell/graphql/generated';

/** One certificate as the report returns it, keyed by host for the table. */
export type SslCertificateRow = SslCertificatesQuery['sslCertificates']['certificates'][number] & {
  id: string;
};

type ChipColor = 'success' | 'warning' | 'error' | 'default';

/** The chip colour each verdict wears. */
export const SSL_STATUS_COLOR: Record<SslCertificateStatus, ChipColor> = {
  [SslCertificateStatus.Ok]: 'success',
  [SslCertificateStatus.Expiring]: 'warning',
  [SslCertificateStatus.Expired]: 'error',
  [SslCertificateStatus.Invalid]: 'error',
  [SslCertificateStatus.Unreachable]: 'default',
};

/** The words each verdict is shown as. */
export const SSL_STATUS_LABEL: Record<SslCertificateStatus, string> = {
  [SslCertificateStatus.Ok]: 'Valid',
  [SslCertificateStatus.Expiring]: 'Expiring soon',
  [SslCertificateStatus.Expired]: 'Expired',
  [SslCertificateStatus.Invalid]: 'Invalid',
  [SslCertificateStatus.Unreachable]: 'Unreachable',
};

/** How many rows carry one of the given verdicts. */
export function countStatus(
  rows: readonly SslCertificateRow[],
  ...statuses: SslCertificateStatus[]
): number {
  const wanted = new Set(statuses);
  return rows.filter((row) => wanted.has(row.status)).length;
}
