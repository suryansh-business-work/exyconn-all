import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartLegend } from '../../../../src/components/report/ChartLegend';
import { ReportTotals } from '../../../../src/components/report/ReportTotals';
import { SkeletonBlock } from '../../../../src/components/report/SkeletonBlock';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';
import { HOUR } from './fixtures';

describe('SkeletonBlock', () => {
  it('stands in for content with whatever size and position its parent gives it', () => {
    renderWithProviders(<SkeletonBlock testID="placeholder" height={72} />);

    const block = screen.getByTestId('placeholder');
    expect(block).toBeInTheDocument();
    expect(block).toBeEmptyDOMElement();
  });
});

describe('ChartLegend', () => {
  it('names every series, in the order the chart stacks them', () => {
    renderWithProviders(
      <ChartLegend
        series={[
          { id: 'active', label: 'Worked', values: [1], color: '#111111' },
          { id: 'idle', label: 'Idle', values: [1], color: '#999999' },
        ]}
      />,
    );

    const worked = screen.getByText('Worked');
    const idle = screen.getByText('Idle');
    expect(worked.compareDocumentPosition(idle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('ReportTotals', () => {
  const totals = { activeMs: 6 * HOUR, idleMs: 2 * HOUR, activityPercent: 75 };

  it('shows the worked, idle and activity figures', () => {
    renderWithProviders(<ReportTotals totals={totals} />);

    expect(screen.getByText('Total worked')).toBeInTheDocument();
    expect(screen.getByText('6h 0m')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('reads each figure as one phrase: its name, then its value', () => {
    renderWithProviders(<ReportTotals totals={totals} />);

    expect(getByA11yLabel('Total worked: 6h 0m')).toBeInTheDocument();
    expect(getByA11yLabel('Total idle: 2h 0m')).toBeInTheDocument();
    expect(getByA11yLabel('Avg activity: 75%')).toBeInTheDocument();
  });

  it('names the figures in the employee’s language', () => {
    renderWithProviders(<ReportTotals totals={totals} />, {
      messages: { 'Total worked': 'Gesamt gearbeitet' },
    });

    expect(screen.getByText('Gesamt gearbeitet')).toBeInTheDocument();
    expect(getByA11yLabel('Gesamt gearbeitet: 6h 0m')).toBeInTheDocument();
  });
});
