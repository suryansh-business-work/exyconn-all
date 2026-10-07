import { screen } from '@testing-library/react';
import { formatCount, formatDayLabel } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { ReportTable } from '../../../../src/components/report/ReportTable';
import { dayRowLabel } from '../../../../src/lib/report/totals';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel, queryByA11yLabel } from '../state';
import { HOUR, reportDay } from './fixtures';

const COLUMNS = ['Day', 'Worked', 'Idle', 'Activity', 'Keys', 'Mouse', 'Sessions'];

describe('ReportTable', () => {
  it('holds the table’s place while the month loads', () => {
    renderWithProviders(<ReportTable days={[reportDay('2026-02-03', HOUR, 0)]} loading />);

    expect(getByA11yLabel('Loading your tracked days')).toBeInTheDocument();
    expect(screen.queryByText('Worked')).not.toBeInTheDocument();
  });

  it('explains an empty month rather than showing an empty table', () => {
    renderWithProviders(<ReportTable days={[]} loading={false} />);

    expect(screen.getByText('No tracked time this month')).toBeInTheDocument();
    expect(
      screen.getByText('Days appear here once you start tracking and sync.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Keys')).not.toBeInTheDocument();
  });

  it('lists one row per day under the seven column headings', () => {
    const days = [
      reportDay('2026-02-03', 6 * HOUR, 2 * HOUR, {
        keyCount: 12_304,
        mouseCount: 512,
        sessions: 3,
      }),
      reportDay('2026-02-04', HOUR, 3 * HOUR),
    ];
    renderWithProviders(<ReportTable days={days} loading={false} />);

    for (const column of COLUMNS) {
      expect(screen.getByText(column)).toBeInTheDocument();
    }
    expect(screen.getByText(formatDayLabel('2026-02-03'))).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText(formatCount(12_304))).toBeInTheDocument();
    expect(screen.getByText(formatCount(512))).toBeInTheDocument();
  });

  it('reads each row as one sentence', () => {
    const day = reportDay('2026-02-03', 6 * HOUR, 2 * HOUR);
    renderWithProviders(<ReportTable days={[day]} loading={false} />);

    expect(getByA11yLabel(dayRowLabel(day))).toBeInTheDocument();
    expect(queryByA11yLabel('Loading your tracked days')).toBeNull();
  });

  it('heads the columns in the employee’s language', () => {
    renderWithProviders(<ReportTable days={[reportDay('2026-02-03', HOUR, 0)]} loading={false} />, {
      messages: { Sessions: 'Sitzungen' },
    });

    expect(screen.getByText('Sitzungen')).toBeInTheDocument();
  });
});
