import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SonarOverviewState } from '@exyconn/shell/graphql/generated';
import { QualityGateBanner } from '../../../../../src/pages/security/sonar/QualityGateBanner';
import { overview } from '../../../../../src/pages/security/sonar/SonarPage.fixtures';
import { renderWithProviders } from '../../../test-utils';

type Gate = Parameters<typeof QualityGateBanner>[0]['gate'];

const condition = (
  metric: string,
  status: string,
  comparator: string,
  threshold: string,
  actual: string,
) => ({
  status,
  metric,
  comparator,
  errorThreshold: threshold,
  actualValue: actual,
});

const FAILED = overview(SonarOverviewState.Ok).sonarOverview.qualityGate as Gate;

describe('QualityGateBanner', () => {
  it('names the failed gate and every condition that did not pass', () => {
    renderWithProviders(<QualityGateBanner gate={FAILED} />);
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorError');
    expect(screen.getByText('Quality gate failed')).toBeInTheDocument();
    expect(screen.getByText('new coverage is 61.2 (must be at least 80)')).toBeInTheDocument();
  });

  it('lists nothing under a passed gate', () => {
    renderWithProviders(
      <QualityGateBanner
        gate={{ status: 'OK', conditions: [condition('bugs', 'OK', 'GT', '0', '0')] }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorSuccess');
    expect(screen.getByText('Quality gate passed')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('words an upper bound as "at most"', () => {
    renderWithProviders(
      <QualityGateBanner
        gate={{
          status: 'WARN',
          conditions: [
            condition('new_duplicated_lines_density', 'WARN', 'GT', '3', '4.2'),
            condition('coverage', 'OK', 'LT', '80', '91'),
          ],
        }}
      />,
    );
    expect(screen.getByText('Quality gate passed with warnings')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(
      screen.getByText('new duplicated lines density is 4.2 (must be at most 3)'),
    ).toBeInTheDocument();
  });

  it('says a project has no gate', () => {
    renderWithProviders(<QualityGateBanner gate={{ status: 'NONE', conditions: [] }} />);
    expect(screen.getByText('This project has no quality gate')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorInfo');
  });

  it('shows a status it does not know as it came, in an info banner', () => {
    renderWithProviders(<QualityGateBanner gate={{ status: 'PENDING', conditions: [] }} />);
    expect(screen.getByText('Quality gate: PENDING')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorInfo');
  });
});
