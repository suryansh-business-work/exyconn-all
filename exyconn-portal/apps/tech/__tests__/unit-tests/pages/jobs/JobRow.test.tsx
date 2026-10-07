import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JobRow } from '../../../../src/pages/jobs';
import type { BackgroundJob } from '../../../../src/pages/jobs/JobsPage';
import { renderWithProviders } from '../../test-utils';

const job = (overrides: Partial<BackgroundJob> = {}): BackgroundJob => ({
  key: 'payslips',
  label: 'Payslip run',
  description: 'Generates payslips on payday',
  lastRunAt: '2026-10-07T06:00:00.000Z',
  lastRunSummary: '12 payslips generated',
  ...overrides,
});

const formatDateTime = (value: string | null | undefined) => `at ${value ?? ''}`;

describe('JobRow', () => {
  it('names the loop, says what it does and what its last pass did', () => {
    renderWithProviders(
      <JobRow job={job()} busy={false} formatDateTime={formatDateTime} onRun={vi.fn()} />,
    );

    expect(screen.getByText('Payslip run')).toBeInTheDocument();
    expect(screen.getByText('Generates payslips on payday')).toBeInTheDocument();
    expect(
      screen.getByText('Last run at 2026-10-07T06:00:00.000Z — 12 payslips generated'),
    ).toBeInTheDocument();
  });

  it('says a pass had nothing to report when it left no summary', () => {
    renderWithProviders(
      <JobRow
        job={job({ lastRunSummary: '' })}
        busy={false}
        formatDateTime={formatDateTime}
        onRun={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Last run at 2026-10-07T06:00:00.000Z — nothing to report'),
    ).toBeInTheDocument();
  });

  it('says honestly when the loop has not ticked since the server started', () => {
    renderWithProviders(
      <JobRow
        job={job({ lastRunAt: null })}
        busy={false}
        formatDateTime={formatDateTime}
        onRun={vi.fn()}
      />,
    );

    expect(screen.getByText('Not since this server started')).toBeInTheDocument();
  });

  it('runs the job now, and not while another run is in flight', async () => {
    const onRun = vi.fn();
    const { rerender } = renderWithProviders(
      <JobRow job={job()} busy={false} formatDateTime={formatDateTime} onRun={onRun} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Run now' }));
    expect(onRun).toHaveBeenCalledTimes(1);

    rerender(<JobRow job={job()} busy formatDateTime={formatDateTime} onRun={onRun} />);
    expect(screen.getByRole('button', { name: 'Run now' })).toBeDisabled();
  });
});
