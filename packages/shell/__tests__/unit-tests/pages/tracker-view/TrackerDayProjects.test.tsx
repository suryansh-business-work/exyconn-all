import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerDayProjects } from '@/pages/tracker-view/TrackerDayProjects';
import { TrackerScreenshotActivity } from '@/pages/tracker-view/TrackerScreenshotActivity';
import { renderWithProviders } from '../../test-utils';
import { HOUR_MS, makeSession } from './fixtures';

describe('TrackerDayProjects', () => {
  it('says so when the day has no sessions', () => {
    renderWithProviders(<TrackerDayProjects sessions={[]} />);

    expect(screen.getByText('No sessions on this day.')).toBeInTheDocument();
  });

  it('totals worked time per project, largest first, booking nameless sessions as unattributed', () => {
    renderWithProviders(
      <TrackerDayProjects
        sessions={[
          makeSession({ id: 's1', projectName: 'Website', activeMs: HOUR_MS }),
          makeSession({ id: 's2', projectName: '', activeMs: 30 * 60_000 }),
          makeSession({ id: 's3', projectName: 'Payroll', activeMs: 2 * HOUR_MS }),
          makeSession({ id: 's4', projectName: 'Website', activeMs: 2 * HOUR_MS }),
        ]}
      />,
    );

    const names = screen
      .getAllByText(/^(Website|Payroll|Unattributed)$/)
      .map((el) => el.textContent);
    expect(names).toEqual(['Website', 'Payroll', 'Unattributed']);
    expect(screen.getByText('3h 0m')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
    expect(screen.getByText('30m')).toBeInTheDocument();
  });
});

describe('TrackerScreenshotActivity', () => {
  it('shows the activity level as a labelled bar and as a number', () => {
    renderWithProviders(<TrackerScreenshotActivity percent={64} />);

    const bar = screen.getByRole('progressbar', { name: 'Activity 64%' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
    expect(screen.getByText('64%')).toBeInTheDocument();
  });
});
