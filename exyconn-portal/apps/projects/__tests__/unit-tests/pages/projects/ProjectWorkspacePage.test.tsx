import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectStatus, SprintState } from '@exyconn/shell/graphql/generated';
import { ProjectWorkspacePage } from '../../../../src/pages/projects';
import { renderWithProviders } from '../../test-utils';
import { sprintRow } from '../../fixtures';
import { pickOption } from '../../helpers/form-helpers';
import { UrlProbe } from '../../helpers/form-stub';

const gql = vi.hoisted(() => ({ project: vi.fn(), sprints: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetProjectQuery: (options: unknown) => gql.project(options),
  useProjectSprintsQuery: (options: unknown) => gql.sprints(options),
}));

/** Each view has its own tests; here every one says which project (and filter) it was given. */
vi.mock('../../../../src/pages/projects/board/ProjectBoardPage', () => ({
  ProjectBoardPage: (p: Readonly<{ projectId: string; sprintFilter: string }>) => (
    <p>{`Board of ${p.projectId} showing "${p.sprintFilter}"`}</p>
  ),
}));
vi.mock('../../../../src/pages/projects/tickets/ProjectTicketsPage', () => ({
  ProjectTicketsPage: (p: Readonly<{ projectId: string }>) => <p>{`Tickets of ${p.projectId}`}</p>,
}));
vi.mock('../../../../src/pages/projects/sprints/ProjectSprintsPage', () => ({
  ProjectSprintsPage: (p: Readonly<{ projectId: string }>) => <p>{`Sprints of ${p.projectId}`}</p>,
}));
vi.mock('../../../../src/pages/projects/docs/ProjectDocsPage', () => ({
  ProjectDocsPage: (p: Readonly<{ projectId: string }>) => <p>{`Docs of ${p.projectId}`}</p>,
}));
vi.mock('../../../../src/pages/projects/health/ProjectHealthPage', () => ({
  ProjectHealthPage: (p: Readonly<{ projectId: string }>) => <p>{`Health of ${p.projectId}`}</p>,
}));
vi.mock('../../../../src/pages/projects/time-log/ProjectTimeLogPage', () => ({
  ProjectTimeLogPage: (
    p: Readonly<{ projectId: string; budgetHours: number | null; budgetAmount: number | null }>,
  ) => (
    <p>{`Time of ${p.projectId}: ${p.budgetHours ?? 'no hours'} / ${p.budgetAmount ?? 'no money'}`}</p>
  ),
}));

const PROJECT = {
  __typename: 'Project',
  id: 'p1',
  name: 'Website',
  key: 'WEB',
  description: null,
  status: ProjectStatus.Active,
  clientName: 'Northwind',
  budgetHours: 400,
  budgetAmount: 50000,
};

const renderAt = (tab: string) =>
  renderWithProviders(
    <>
      <ProjectWorkspacePage />
      <UrlProbe />
    </>,
    { route: `/projects/p1/${tab}`, path: '/projects/:id/:tab?/:pageId?' },
  );

describe('ProjectWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.project.mockReturnValue({ data: { getProject: PROJECT } });
    gql.sprints.mockReturnValue({
      data: {
        projectSprints: [
          sprintRow({ id: 's1', name: 'Sprint 11', state: SprintState.Completed }),
          sprintRow({ id: 's2', name: 'Sprint 12', state: SprintState.Active }),
        ],
      },
    });
  });

  it('heads the page with the project, its key, status and client', () => {
    renderAt('board');

    expect(screen.getByRole('heading', { name: 'Website' })).toBeInTheDocument();
    expect(screen.getByText('WEB')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Northwind')).toBeInTheDocument();
    expect(gql.project).toHaveBeenCalledWith({ variables: { id: 'p1' }, skip: false });
    expect(gql.sprints).toHaveBeenCalledWith({
      variables: { projectId: 'p1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('opens the board on the sprint that is running', () => {
    renderAt('board');

    expect(screen.getByText('Board of p1 showing "s2"')).toBeInTheDocument();
  });

  it('lets the viewer switch the board to the backlog or to every ticket', async () => {
    renderAt('board');

    await pickOption(/^Sprint/, 'Backlog');
    expect(screen.getByText('Board of p1 showing "backlog"')).toBeInTheDocument();

    await pickOption(/^Sprint/, 'All tickets');
    expect(screen.getByText('Board of p1 showing ""')).toBeInTheDocument();
  });

  it('shows every board when no sprint is running', () => {
    gql.sprints.mockReturnValue({ data: undefined });
    renderAt('board');

    expect(screen.getByText('Board of p1 showing ""')).toBeInTheDocument();
  });

  it('hands the time log the agreed budgets', () => {
    renderAt('time-log');

    expect(screen.getByText('Time of p1: 400 / 50000')).toBeInTheDocument();
  });

  it('falls back to a plain heading, no chips and no budgets before the project loads', () => {
    gql.project.mockReturnValue({ data: undefined });
    renderAt('time-log');

    expect(screen.getByRole('heading', { name: 'Project' })).toBeInTheDocument();
    expect(screen.queryByText('WEB')).not.toBeInTheDocument();
    expect(screen.getByText('Time of p1: no hours / no money')).toBeInTheDocument();
  });

  it('keeps the open view in the URL as the tabs are switched', async () => {
    renderAt('health');
    expect(screen.getByText('Health of p1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Tickets' }));
    expect(screen.getByText('Tickets of p1')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/projects/p1/tickets');

    await userEvent.click(screen.getByRole('tab', { name: 'Sprints' }));
    expect(screen.getByText('Sprints of p1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    expect(screen.getByText('Docs of p1')).toBeInTheDocument();
  });

  it('goes back to the project register', async () => {
    renderAt('board');

    await userEvent.click(screen.getByRole('button', { name: 'Projects' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent('/projects/list');
  });

  it('asks for nothing until the URL names a project', () => {
    renderWithProviders(<ProjectWorkspacePage />);

    expect(gql.project).toHaveBeenCalledWith({ variables: { id: '' }, skip: true });
    expect(gql.sprints).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });
});
