import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListProjectsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ProjectsPage } from '../../../../src/pages/projects';
import { PROJECT_COLUMNS } from '../../../../src/pages/projects/projects-grid';
import { renderWithProviders } from '../../test-utils';
import { pending, projectRow, tableStats } from '../../fixtures';
import { dashboardProps, paged } from '../../helpers/crud-dashboard-stub';
import { answerRowConfirm, runRowAction, statLines } from '../../helpers/crud-page-helpers';
import { UrlProbe } from '../../helpers/form-stub';

const gql = vi.hoisted(() => ({ stats: vi.fn(), refetch: vi.fn(), deleteProject: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListProjectsStatsQuery: () => gql.stats(),
  useDeleteProjectMutation: () => [gql.deleteProject],
}));

vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../../helpers/crud-dashboard-stub');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});

vi.mock('../../../../src/pages/projects/forms/project', async () => ({
  ProjectForm: (await import('../../helpers/form-stub')).FormStub,
}));

/** The shares drawer has its own tests; here it shows which project it was opened for. */
vi.mock('../../../../src/pages/projects/shares', () => ({
  ProjectSharesDrawer: ({
    project,
    onClose,
  }: Readonly<{ project: { name: string } | null; onClose: () => void }>) =>
    project ? (
      <div>
        <p>{`Links for ${project.name}`}</p>
        <button type="button" onClick={onClose}>
          Close links
        </button>
      </div>
    ) : null,
}));

const renderPage = () =>
  renderWithProviders(
    <>
      <ProjectsPage />
      <UrlProbe />
    </>,
  );

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.deleteProject.mockResolvedValue({ data: { deleteProject: true } });
    gql.stats.mockReturnValue({
      data: {
        listProjectsStats: tableStats(7, { status: { ACTIVE: 3, ON_HOLD: 1, COMPLETED: 2 } }),
      },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('counts the projects by status from the stats query', () => {
    renderPage();

    expect(statLines()).toEqual(['Total: 7', 'Active: 3', 'On hold: 1', 'Completed: 2']);
    expect(dashboardProps().statsLoading).toBe(false);
  });

  it('marks the tiles loading until the stats answer', () => {
    gql.stats.mockReturnValue(pending());
    renderPage();

    expect(dashboardProps().statsLoading).toBe(true);
    expect(statLines()[0]).toBe('Total: 0');
  });

  it('drives the server grid with the paged projects query and the project columns', () => {
    renderPage();
    const page = { totalCount: 1, rows: [projectRow()] };

    expect(paged.document).toBe(ListProjectsPagedDocument);
    expect(paged.select?.({ listProjectsPaged: page } as never)).toBe(page);
    expect(dashboardProps().columnDefs).toBe(PROJECT_COLUMNS);
    expect(dashboardProps()).toMatchObject({ title: 'Projects', exportFileName: 'projects' });
  });

  it('opens a project on its board from the row action and from a row click', async () => {
    renderPage();

    await runRowAction('board', projectRow({ id: 'proj-5' }));
    expect(screen.getByLabelText('current url')).toHaveTextContent('/projects/proj-5/board');

    act(() => {
      dashboardProps().onRowClick?.(projectRow({ id: 'proj-6' }) as never);
    });
    expect(screen.getByLabelText('current url')).toHaveTextContent('/projects/proj-6/board');
  });

  it('opens the client links for a project and closes them again', async () => {
    renderPage();
    expect(screen.queryByText(/Links for/)).not.toBeInTheDocument();

    await runRowAction('share', projectRow({ name: 'Billing' }));
    expect(screen.getByText('Links for Billing')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close links' }));
    expect(screen.queryByText('Links for Billing')).not.toBeInTheDocument();
  });

  it('opens the form blank for a new project and with the row for an edit', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));

    await runRowAction('edit', projectRow({ name: 'Intranet' }));
    expect(screen.getByText(/"name":"Intranet"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Intranet/)).not.toBeInTheDocument();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('deletes a project after confirming, by its id', async () => {
    renderPage();

    await answerRowConfirm(
      'delete',
      projectRow({ id: 'proj-4' }),
      'Delete project "Website"?',
      'Delete',
    );

    expect(gql.deleteProject).toHaveBeenCalledWith({ variables: { id: 'proj-4' } });
    expect(await screen.findByText('Project deleted')).toBeInTheDocument();
  });
});
