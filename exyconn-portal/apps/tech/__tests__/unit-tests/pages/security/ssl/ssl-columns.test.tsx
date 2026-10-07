import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import { sslColumns } from '../../../../../src/pages/security/ssl/ssl-columns';
import type { SslCertificateRow } from '../../../../../src/pages/security/ssl/ssl.types';
import { createWrapper } from '../../../test-utils';
import { certificate } from './ssl.fixtures';

const formatDate = vi.fn((value: string) => `date(${value})`);

/** Renders one column's cell for the row. */
function cell(key: string, row: SslCertificateRow) {
  const column = sslColumns(30, formatDate).find((col) => col.key === key);
  if (!column?.render) {
    throw new Error(`No rendered column ${key}`);
  }
  return render(<>{column.render(row)}</>, { wrapper: createWrapper() });
}

const OK = certificate('portal.exyconn.com', SslCertificateStatus.Ok, 80, {
  monitors: ['Portal', 'Portal API'],
});
const UNKNOWN = certificate('gone.exyconn.com', SslCertificateStatus.Unreachable, null, {
  issuer: '',
  error: '',
});

describe('sslColumns', () => {
  it('lists the columns in table order', () => {
    expect(sslColumns(30, formatDate).map((col) => col.label)).toEqual([
      'Host',
      'Status',
      'Days left',
      'Expires',
      'Issuer',
      'Protocol',
      'Problem',
    ]);
  });

  it('shows the host with the monitors it came from', () => {
    cell('host', OK);
    expect(screen.getByText('portal.exyconn.com')).toBeInTheDocument();
    expect(screen.getByText('Portal, Portal API')).toBeInTheDocument();
  });

  it('shows the verdict and the days left', () => {
    cell('status', OK);
    expect(screen.getByText('Valid')).toBeInTheDocument();
    cell('daysLeft', OK);
    expect(screen.getByText('80 days')).toBeInTheDocument();
  });

  it('formats the expiry through the settings, or shows a dash', () => {
    cell('validTo', OK);
    expect(screen.getByText('date(2026-12-01T00:00:00.000Z)')).toBeInTheDocument();
    expect(formatDate).toHaveBeenCalledWith('2026-12-01T00:00:00.000Z');
    formatDate.mockClear();
    cell('validTo', UNKNOWN);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(formatDate).not.toHaveBeenCalled();
  });

  it('shows issuer, protocol and problem, with dashes when blank', () => {
    cell('issuer', OK);
    expect(screen.getByText("Let's Encrypt (R11)")).toBeInTheDocument();
    cell('protocol', OK);
    expect(screen.getByText('TLSv1.3')).toBeInTheDocument();
    const failing = certificate('old.exyconn.com', SslCertificateStatus.Expired, -1, {
      error: 'CERT_HAS_EXPIRED',
    });
    cell('error', failing);
    expect(screen.getByText('CERT_HAS_EXPIRED')).toBeInTheDocument();
  });

  it('shows a dash for every blank text cell', () => {
    cell('issuer', UNKNOWN);
    cell('protocol', UNKNOWN);
    cell('error', UNKNOWN);
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
