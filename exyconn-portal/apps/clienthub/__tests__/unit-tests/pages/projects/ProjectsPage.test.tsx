import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ProjectStatus } from '@exyconn/shell/graphql/generated';
import { ProjectsPage } from '../../../../src/pages/projects/ProjectsPage';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ useClientHubProjectsQuery: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const project = (id: string, name: string) => ({
  id,
  name,
  status: ProjectStatus.Active,
  startDate: null,
  endDate: null,
  budgetHours: null,
  trackedHours: 3,
  milestones: [],
  ticketCounts: [],
});

describe('ProjectsPage', () => {
  it('shows a spinner until the projects first arrive', () => {
    gql.useClientHubProjectsQuery.mockReturnValue({ data: undefined, loading: true });
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
  });

  it('explains that projects will appear once there are some', () => {
    gql.useClientHubProjectsQuery.mockReturnValue({
      data: { clientHubProjects: [] },
      loading: false,
    });
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Projects we run for you appear here.')).toBeInTheDocument();
  });

  it('shows a card for every project, keeping them on screen while they refresh', () => {
    gql.useClientHubProjectsQuery.mockReturnValue({
      data: { clientHubProjects: [project('p1', 'Billing revamp'), project('p2', 'Mobile app')] },
      loading: true,
    });
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByText('Billing revamp')).toBeInTheDocument();
    expect(screen.getByText('Mobile app')).toBeInTheDocument();
    expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('treats a finished load with no answer as no projects', () => {
    gql.useClientHubProjectsQuery.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
  });
});
