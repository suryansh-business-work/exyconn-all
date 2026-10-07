import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SslCertificateStatus } from '@exyconn/shell/graphql/generated';
import { SslCertificateDialog } from '../../../../../src/pages/security/ssl/SslCertificateDialog';
import { renderWithProviders } from '../../../test-utils';
import { certificate } from './ssl.fixtures';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../use-settings.mock')).settingsModule(),
);

/** The value printed under one fact's label. */
function fact(label: string): string | null | undefined {
  return within(screen.getByRole('dialog')).getByText(label).nextElementSibling?.textContent;
}

describe('SslCertificateDialog', () => {
  it('renders nothing while no certificate is chosen', () => {
    renderWithProviders(
      <SslCertificateDialog certificate={null} warningDays={30} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists everything the handshake read off a trusted certificate', () => {
    const cert = certificate('portal.exyconn.com', SslCertificateStatus.Ok, 80);
    renderWithProviders(
      <SslCertificateDialog certificate={cert} warningDays={30} onClose={vi.fn()} />,
    );
    expect(screen.getByRole('dialog', { name: 'portal.exyconn.com' })).toBeInTheDocument();
    expect(fact('Status')).toBe('Valid');
    expect(fact('Days left')).toBe('80 days');
    expect(fact('Valid from')).toBe('at(2026-08-01T00:00:00.000Z)');
    expect(fact('Valid until')).toBe('at(2026-12-01T00:00:00.000Z)');
    expect(fact('Subject')).toBe('portal.exyconn.com');
    expect(fact('Issuer')).toBe("Let's Encrypt (R11)");
    expect(fact('Protocol')).toBe('TLSv1.3');
    expect(fact('Chain trusted')).toBe('Yes');
    expect(fact('Checked')).toBe('at(2026-10-04T08:00:00.000Z)');
    expect(fact('Monitors')).toBe('portal.exyconn.com monitor');
    expect(fact('Names covered')).toBe('portal.exyconn.com, www.portal.exyconn.com');
    expect(fact('Serial number')).toBe('0A1B2C');
    expect(fact('SHA-256 fingerprint')).toBe('AA:BB:CC:DD');
    expect(screen.queryByText('Problem')).not.toBeInTheDocument();
  });

  it('shows dashes for what an unreachable host could not tell, and the problem', () => {
    const cert = certificate('gone.exyconn.com', SslCertificateStatus.Unreachable, null, {
      subject: '',
      issuer: '',
      altNames: [],
      serialNumber: '',
      fingerprint256: '',
      error: 'ECONNREFUSED',
    });
    renderWithProviders(
      <SslCertificateDialog certificate={cert} warningDays={30} onClose={vi.fn()} />,
    );
    expect(fact('Valid from')).toBe('—');
    expect(fact('Valid until')).toBe('—');
    expect(fact('Days left')).toBe('—');
    expect(fact('Subject')).toBe('—');
    expect(fact('Issuer')).toBe('—');
    expect(fact('Protocol')).toBe('—');
    expect(fact('Chain trusted')).toBe('No');
    expect(fact('Names covered')).toBe('—');
    expect(fact('Serial number')).toBe('—');
    expect(fact('SHA-256 fingerprint')).toBe('—');
    expect(fact('Problem')).toBe('ECONNREFUSED');
  });

  it('closes on Close', async () => {
    const onClose = vi.fn();
    const cert = certificate('hr.exyconn.com', SslCertificateStatus.Expiring, 12);
    renderWithProviders(
      <SslCertificateDialog certificate={cert} warningDays={30} onClose={onClose} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
