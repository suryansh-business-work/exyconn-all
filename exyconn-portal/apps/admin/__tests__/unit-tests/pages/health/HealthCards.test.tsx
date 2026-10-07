import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { HealthFactsCard } from '../../../../src/pages/health/HealthFactsCard';
import { HealthJobsCard } from '../../../../src/pages/health/HealthJobsCard';
import { HealthBackupCard } from '../../../../src/pages/health/HealthBackupCard';
import { backup, formatDateTime, job } from './health.fixtures';

describe('HealthFactsCard', () => {
  it('lists every fact under its title as a label and a value', () => {
    renderWithProviders(
      <HealthFactsCard
        title="Runtime"
        facts={[
          { label: 'Node', value: 'v22' },
          { label: 'Uptime', value: '4d 6h' },
        ]}
      />,
    );
    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.getByText('Node')).toBeInTheDocument();
    expect(screen.getByText('v22')).toBeInTheDocument();
    expect(screen.getByText('4d 6h')).toBeInTheDocument();
  });
});

describe('HealthJobsCard', () => {
  it('shows an enabled job with when it last ran and what it did', () => {
    renderWithProviders(<HealthJobsCard jobs={[job()]} formatDateTime={formatDateTime} />);
    expect(screen.getByText('Background jobs')).toBeInTheDocument();
    expect(screen.getByText('Payslip schedule')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Last run: at 2026-10-01T03:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Sent 4 payslips')).toBeInTheDocument();
  });

  it('says a job that is off has not run since the restart, with no summary line', () => {
    renderWithProviders(
      <HealthJobsCard
        jobs={[job({ key: 'reminders', enabled: false, lastRunAt: null, lastRunSummary: '' })]}
        formatDateTime={formatDateTime}
      />,
    );
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('Last run: Not since restart')).toBeInTheDocument();
    expect(screen.queryByText('Sent 4 payslips')).toBeNull();
  });
});

describe('HealthBackupCard', () => {
  it('reports a successful backup with its run time, archive and retention', () => {
    renderWithProviders(<HealthBackupCard backup={backup()} formatDateTime={formatDateTime} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Last backup succeeded.');
    expect(screen.getByText('Last run: at 2026-10-01T02:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('exyconn-2026-10-01.gz — 12.5 MB')).toBeInTheDocument();
    expect(screen.getByText('Archives kept for 14 days')).toBeInTheDocument();
  });

  it('reports a failed backup loudly, with the failure message', () => {
    renderWithProviders(
      <HealthBackupCard
        backup={backup({ ok: false, message: 'Disk full', archive: '' })}
        formatDateTime={formatDateTime}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('The last backup failed.');
    expect(screen.getByText('Disk full')).toBeInTheDocument();
    expect(screen.queryByText(/MB$/)).toBeNull();
  });

  it('shows no message line for a failure that came without one, and "never" with no run', () => {
    renderWithProviders(
      <HealthBackupCard
        backup={backup({ ok: false, message: '', lastRunAt: null })}
        formatDateTime={formatDateTime}
      />,
    );
    expect(screen.getByText('Last run: never')).toBeInTheDocument();
    expect(screen.queryByText('Disk full')).toBeNull();
  });

  it('warns when no backup is installed and says how to install one', () => {
    renderWithProviders(
      <HealthBackupCard
        backup={backup({ configured: false, ok: false, message: 'ignored' })}
        formatDateTime={formatDateTime}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('No backup is installed on this host.');
    expect(
      screen.getByText('Run deploy/install-backups.sh on the host to take one every night.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Archives kept/)).toBeNull();
    expect(screen.queryByText('ignored')).toBeNull();
  });
});
