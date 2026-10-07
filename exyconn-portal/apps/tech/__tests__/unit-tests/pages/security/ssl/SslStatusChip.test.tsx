import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import { DaysLeft, SslStatusChip } from '../../../../../src/pages/security/ssl/SslStatusChip';
import { renderWithProviders } from '../../../test-utils';

describe('SslStatusChip', () => {
  it.each([
    [SslCertificateStatus.Ok, 'Valid'],
    [SslCertificateStatus.Expiring, 'Expiring soon'],
    [SslCertificateStatus.Expired, 'Expired'],
    [SslCertificateStatus.Invalid, 'Invalid'],
    [SslCertificateStatus.Unreachable, 'Unreachable'],
  ])('shows %s as "%s"', (status, label) => {
    renderWithProviders(<SslStatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('translates the verdict', () => {
    renderWithProviders(<SslStatusChip status={SslCertificateStatus.Ok} />, {
      messages: { Valid: 'Gültig' },
    });
    expect(screen.getByText('Gültig')).toBeInTheDocument();
  });
});

describe('DaysLeft', () => {
  it('shows a dash when the expiry is unknown', () => {
    const { rerender } = renderWithProviders(<DaysLeft daysLeft={null} warningDays={30} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    rerender(<DaysLeft warningDays={30} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('says how long ago an expired certificate ran out', () => {
    renderWithProviders(<DaysLeft daysLeft={-3} warningDays={30} />);
    expect(screen.getByText('Expired 3 days ago')).toBeInTheDocument();
  });

  it('counts the days left inside and outside the warning window', () => {
    const { rerender } = renderWithProviders(<DaysLeft daysLeft={30} warningDays={30} />);
    expect(screen.getByText('30 days')).toBeInTheDocument();
    rerender(<DaysLeft daysLeft={0} warningDays={30} />);
    expect(screen.getByText('0 days')).toBeInTheDocument();
    rerender(<DaysLeft daysLeft={31} warningDays={30} />);
    expect(screen.getByText('31 days')).toBeInTheDocument();
  });
});
