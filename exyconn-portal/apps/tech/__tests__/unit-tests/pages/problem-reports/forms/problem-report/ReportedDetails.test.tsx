import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { formatWith } from '@exyconn/shell/utils/date';
import { ReportedDetails } from '../../../../../../src/pages/problem-reports/forms/problem-report/ReportedDetails';
import { renderWithProviders } from '../../../../test-utils';
import { reportRow } from '../../report.fixtures';

const RECEIVED = formatWith('2026-10-07T09:15:00.000Z', 'd MMM yyyy, HH:mm');

describe('ReportedDetails', () => {
  it('recaps what the reporter sent, in their own words', () => {
    renderWithProviders(<ReportedDetails report={reportRow()} />);

    expect(screen.getByText('PR-1042 · Portal is slow to load')).toBeInTheDocument();
    expect(
      screen.getByText(`Portal · SLOWNESS · Asha Rao (asha@example.test) · ${RECEIVED}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Every page takes more than ten seconds to open since this morning.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Reported from https://portal.example.test/hr')).toBeInTheDocument();
  });

  it('names the whole platform when no service was picked, and skips a missing page', () => {
    renderWithProviders(<ReportedDetails report={reportRow({ serviceName: '', pageUrl: '' })} />);

    expect(screen.getByText(/^Whole platform · SLOWNESS/)).toBeInTheDocument();
    expect(screen.queryByText(/^Reported from/)).not.toBeInTheDocument();
  });
});
