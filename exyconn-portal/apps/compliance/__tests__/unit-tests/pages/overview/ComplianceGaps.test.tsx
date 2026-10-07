import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ComplianceGaps } from '../../../../src/pages/overview';
import { renderWithProviders } from '../../test-utils';

type Props = ComponentProps<typeof ComplianceGaps>;

const quiet: Props = {
  standardCoverage: [
    { label: 'ISO 9001', value: 2 },
    { label: 'ISO 27001', value: 1 },
  ],
  residualHeat: [],
  findingsOverdue: 0,
  risksPastReview: 0,
  objectivesAtRisk: 0,
  lastReviewOn: null,
  lastReviewTitle: '',
  formatDate: (value) => `on ${value ?? ''}`,
};

const renderGaps = (over: Partial<Props> = {}) =>
  renderWithProviders(<ComplianceGaps {...quiet} {...over} />);

const chip = (label: string) => screen.getByText(label).closest('.MuiChip-root');

describe('ComplianceGaps', () => {
  it('raises no alarm when nothing is overdue, past review or at risk', () => {
    renderGaps();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('No open risks on the register.')).toBeInTheDocument();
    expect(screen.queryByText(/No audit on file for/)).not.toBeInTheDocument();
  });

  it('counts what is overdue, past review and at risk', () => {
    renderGaps({ findingsOverdue: 3, risksPastReview: 2, objectivesAtRisk: 1 });
    expect(
      screen.getByText('3 corrective action(s) are past their agreed date.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 open risk(s) are past their review date.')).toBeInTheDocument();
    expect(screen.getByText('1 objective(s) are at risk or already missed.')).toBeInTheDocument();
    expect(screen.getAllByRole('alert')).toHaveLength(3);
  });

  it('shows the residual risk being carried, one chip per level', () => {
    renderGaps({
      residualHeat: [
        { label: 'LOW', value: 4 },
        { label: 'CRITICAL', value: 1 },
        { label: 'UNBANDED', value: 2 },
      ],
    });
    expect(screen.getByText('LOW · 4')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL · 1')).toBeInTheDocument();
    expect(screen.getByText('UNBANDED · 2')).toBeInTheDocument();
    expect(screen.queryByText('No open risks on the register.')).not.toBeInTheDocument();
  });

  it('marks audited standards green and names the ones never audited', () => {
    renderGaps({
      standardCoverage: [
        { label: 'ISO 9001', value: 2 },
        { label: 'ISO 14001', value: 0 },
        { label: 'ISO 45001', value: 0 },
      ],
    });
    expect(chip('ISO 9001 · 2')).toHaveClass('MuiChip-filled', 'MuiChip-colorSuccess');
    expect(chip('ISO 14001 · 0')).toHaveClass('MuiChip-outlined', 'MuiChip-colorError');
    expect(screen.getByText('No audit on file for: ISO 14001, ISO 45001')).toBeInTheDocument();
  });

  it('says when leadership last reviewed the system', () => {
    renderGaps({ lastReviewOn: '2026-09-30', lastReviewTitle: 'Q3 review' });
    expect(screen.getByText('Q3 review — on 2026-09-30')).toBeInTheDocument();
  });

  it('says so when leadership has never recorded a review', () => {
    renderGaps();
    expect(screen.getByText('Leadership has never recorded one.')).toBeInTheDocument();
  });
});
