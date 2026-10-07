import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { ProjectRisk, ProjectTimeline } from '@exyconn/shell/graphql/generated';
import { ProjectHealthPage } from '../../../../../src/pages/projects/health';
import { renderWithProviders } from '../../../test-utils';
import { healthFixture, type HealthFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({ health: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectHealthQuery: (options: unknown) => gql.health(options),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDate: (value: string) => `on ${value}` }),
}));

const answer = (health: HealthFixture | undefined, loading = false) =>
  gql.health.mockReturnValue({ data: health ? { projectHealth: health } : undefined, loading });

/** The one figure tile whose label is `label`. */
const tile = (label: string) => within(screen.getByText(label).parentElement as HTMLElement);

describe('ProjectHealthPage', () => {
  beforeEach(() => {
    gql.health.mockReset();
  });

  it('asks for the project health and says it is loading until it answers', () => {
    answer(undefined, true);
    renderWithProviders(<ProjectHealthPage projectId="proj-1" />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(gql.health).toHaveBeenCalledWith({
      variables: { id: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('skips the query without a project and says there is nothing to report', () => {
    answer(undefined);
    renderWithProviders(<ProjectHealthPage projectId="" />);

    expect(screen.getByText('No health to report yet.')).toBeInTheDocument();
    expect(gql.health).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('reads a healthy project: risk, timeline, end date and every figure', () => {
    answer(healthFixture());
    renderWithProviders(<ProjectHealthPage projectId="proj-1" />);

    expect(screen.getAllByText('On track')).toHaveLength(2);
    expect(screen.getByText('on 2026-12-01T00:00:00.000Z')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(tile('Progress').getByText('40%')).toBeInTheDocument();
    expect(tile('Hours').getByText('50%')).toBeInTheDocument();
    expect(tile('Hours').getByText('50 logged of 100')).toBeInTheDocument();
    expect(tile('Hours').getByRole('progressbar')).toHaveClass('MuiLinearProgress-colorSuccess');
    expect(tile('Tickets').getByText('4/10')).toBeInTheDocument();
    expect(tile('Open bugs').getByText('3')).toBeInTheDocument();
    expect(tile('Team').getByText('4')).toBeInTheDocument();
  });

  it('lists the reasons a high-risk project is at risk as an error', () => {
    answer(
      healthFixture({
        risk: ProjectRisk.High,
        timeline: ProjectTimeline.Overdue,
        riskReasons: ['Past its end date', 'Over its hours'],
        budgetUsedPercent: 130,
      }),
    );
    renderWithProviders(<ProjectHealthPage projectId="proj-1" />);

    expect(screen.getByText('At risk')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-colorError');
    expect(within(alert).getByText('Past its end date')).toBeInTheDocument();
    expect(within(alert).getByText('Over its hours')).toBeInTheDocument();
    expect(tile('Hours').getByText('130%')).toBeInTheDocument();
    expect(tile('Hours').getByRole('progressbar')).toHaveClass('MuiLinearProgress-colorError');
  });

  it('warns rather than alarms for a project worth watching, and turns the hours bar amber at 90%', () => {
    answer(
      healthFixture({
        risk: ProjectRisk.Medium,
        timeline: ProjectTimeline.DueSoon,
        riskReasons: ['Due within two weeks'],
        budgetUsedPercent: 90,
      }),
    );
    renderWithProviders(<ProjectHealthPage projectId="proj-1" />);

    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText('Due soon')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-colorWarning');
    expect(tile('Hours').getByRole('progressbar')).toHaveClass('MuiLinearProgress-colorWarning');
  });

  it('explains the figures it cannot measure instead of inventing them', () => {
    answer(
      healthFixture({
        risk: ProjectRisk.Unknown,
        timeline: ProjectTimeline.NoDates,
        endDate: null,
        progressPercent: null,
        budgetHours: null,
        budgetUsedPercent: undefined,
        loggedHours: 12,
      }),
    );
    renderWithProviders(<ProjectHealthPage projectId="proj-1" />);

    expect(screen.getByText('Not measured')).toBeInTheDocument();
    expect(screen.getByText('No end date')).toBeInTheDocument();
    expect(screen.getByText('No end date set')).toBeInTheDocument();
    expect(tile('Progress').getByText('Not tracked')).toBeInTheDocument();
    expect(
      tile('Progress').getByText('Mark a board column as done to track this'),
    ).toBeInTheDocument();
    expect(tile('Progress').queryByRole('progressbar')).not.toBeInTheDocument();
    expect(tile('Hours').getByText('No budget set')).toBeInTheDocument();
    expect(tile('Hours').getByText('12 logged')).toBeInTheDocument();
    expect(tile('Hours').queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
