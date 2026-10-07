import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { SonarMetricGrid } from '../../../../../src/pages/security/sonar/SonarMetricGrid';
import { overview } from '../../../../../src/pages/security/sonar/SonarPage.fixtures';
import type { SonarMetricsData } from '../../../../../src/pages/security/sonar/sonar.types';
import { renderWithProviders } from '../../../test-utils';
import { formatters } from '../use-settings.mock';

vi.mock('@exyconn/shell/hooks/useSettings', async () =>
  (await import('../use-settings.mock')).settingsModule(),
);

const METRICS = overview(SonarOverviewState.Ok).sonarOverview.metrics as SonarMetricsData;

const UNKNOWN: SonarMetricsData = {
  alertStatus: 'NONE',
  bugs: null,
  vulnerabilities: null,
  securityHotspots: null,
  codeSmells: null,
  coverage: null,
  duplicatedLinesDensity: null,
  ncloc: null,
  reliabilityRating: null,
  securityRating: null,
  maintainabilityRating: null,
  technicalDebtMinutes: null,
  newBugs: null,
  newVulnerabilities: null,
  newSecurityHotspots: null,
  newCodeSmells: null,
  newCoverage: null,
  newDuplicatedLinesDensity: null,
};

/** The tile whose label is `label`: label and figure share the tile two levels up. */
const tile = (label: string) =>
  within(screen.getByText(label).parentElement?.parentElement as HTMLElement);

describe('SonarMetricGrid', () => {
  beforeEach(() => {
    formatters.formatPercent.mockClear();
  });

  it('shows each issue count with its rating and what new code added', () => {
    renderWithProviders(<SonarMetricGrid metrics={METRICS} />);
    expect(tile('Bugs').getByText('#3')).toBeInTheDocument();
    expect(tile('Bugs').getByLabelText('Reliability rating C')).toHaveTextContent('C');
    expect(tile('Bugs').getByText('#1 on new code')).toBeInTheDocument();
    expect(tile('Vulnerabilities').getByText('#0')).toBeInTheDocument();
    expect(tile('Vulnerabilities').getByLabelText('Security rating A')).toBeInTheDocument();
    expect(tile('Vulnerabilities').queryByText(/on new code/)).not.toBeInTheDocument();
    expect(tile('Security hotspots').getByText('#2')).toBeInTheDocument();
    expect(tile('Security hotspots').queryByLabelText(/rating/)).not.toBeInTheDocument();
  });

  it('turns technical debt minutes into hours', () => {
    renderWithProviders(<SonarMetricGrid metrics={{ ...METRICS, technicalDebtMinutes: 125 }} />);
    expect(tile('Code smells').getByText('#140')).toBeInTheDocument();
    expect(tile('Code smells').getByLabelText('Maintainability rating A')).toBeInTheDocument();
    expect(tile('Code smells').getByText('#2 h of technical debt')).toBeInTheDocument();
  });

  it('shows coverage and duplication as percentages with a bar', () => {
    renderWithProviders(<SonarMetricGrid metrics={METRICS} />);
    expect(tile('Coverage').getByText('72.5%')).toBeInTheDocument();
    expect(tile('Coverage').getByRole('progressbar', { name: 'Coverage' })).toBeInTheDocument();
    expect(tile('Coverage').getByText('61.2% on new code')).toBeInTheDocument();
    expect(tile('Duplications').getByText('4.2%')).toBeInTheDocument();
    expect(formatters.formatPercent).toHaveBeenCalledWith(72.5, { maximumFractionDigits: 1 });
    expect(tile('Lines of code').getByText('#52000')).toBeInTheDocument();
  });

  it('shows a dash for every measure the server did not compute', () => {
    renderWithProviders(<SonarMetricGrid metrics={UNKNOWN} />);
    expect(screen.getAllByText('—')).toHaveLength(7);
    expect(screen.queryByText(/on new code|technical debt/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/rating/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(formatters.formatPercent).not.toHaveBeenCalled();
  });

  it('treats a measure the server left out like one it did not compute', () => {
    renderWithProviders(<SonarMetricGrid metrics={{}} />);
    expect(screen.getAllByText('—')).toHaveLength(7);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('wears a neutral chip for a rating outside A–E', () => {
    renderWithProviders(<SonarMetricGrid metrics={{ ...METRICS, reliabilityRating: 'Z' }} />);
    expect(screen.getByLabelText('Reliability rating Z')).toHaveClass('MuiChip-colorDefault');
    expect(screen.getByLabelText('Security rating A')).toHaveClass('MuiChip-colorSuccess');
  });

  it('keeps a bar inside 0–100 whatever the server reports', () => {
    renderWithProviders(
      <SonarMetricGrid metrics={{ ...METRICS, coverage: 140, duplicatedLinesDensity: -2 }} />,
    );
    expect(screen.getByRole('progressbar', { name: 'Coverage' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: 'Duplications' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});
