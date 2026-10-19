import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowsPage } from '../../../../src/pages/workflows';
import { renderWithProviders } from '../../test-utils';
import { UrlProbe } from '../../helpers/form-stub';
import { pending } from '../../fixtures';
import { workflowSummary } from './workflow-fixtures';
import { STUB_DETAILS } from './workflow-form.stub';

const gql = vi.hoisted(() => ({
  list: vi.fn(),
  refetch: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectWorkflowsQuery: (options: unknown) => gql.list(options),
}));

vi.mock('../../../../src/pages/workflows/useWorkflowMutations', () => ({
  useWorkflowMutations: () => ({ create: gql.create, remove: gql.remove, update: vi.fn() }),
}));

vi.mock('../../../../src/pages/workflows/forms/workflow', async () => ({
  WorkflowForm: (await import('./workflow-form.stub')).WorkflowFormStub,
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value.slice(0, 10)}` }),
}));

const ROWS = [
  workflowSummary(),
  workflowSummary({ id: 'wf-2', name: 'Release sign-off', updatedAt: '2026-03-01T08:00:00Z' }),
];

const renderPage = () =>
  renderWithProviders(
    <>
      <WorkflowsPage />
      <UrlProbe />
    </>,
    { route: '/projects/workflows' },
  );

const url = () => screen.getByLabelText('current url').textContent;

describe('WorkflowsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.list.mockReturnValue({
      data: { projectWorkflows: ROWS },
      loading: false,
      error: undefined,
      refetch: gql.refetch,
    });
    gql.create.mockResolvedValue('wf-new');
    gql.remove.mockResolvedValue(true);
    gql.confirm.mockResolvedValue(true);
    gql.refetch.mockResolvedValue({});
  });

  it('lists the workflows with who changed them and when, fresh from the network', () => {
    renderPage();

    expect(gql.list).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    const row = screen.getByText('Release sign-off').closest('tr') as HTMLElement;
    expect(within(row).getByText('Priya')).toBeInTheDocument();
    expect(within(row).getByText('at 2026-03-01')).toBeInTheDocument();
    expect(screen.getByText('Bug triage')).toBeInTheDocument();
  });

  it('opens the designer for the row clicked', async () => {
    renderPage();

    await userEvent.click(screen.getByText('Release sign-off'));

    expect(url()).toBe('/projects/workflows/wf-2');
  });

  it('says so when there are no workflows, and while the first load runs', () => {
    gql.list.mockReturnValue({ ...pending(), error: undefined });
    const { unmount } = renderPage();
    expect(screen.queryByText('No workflows yet. Create one to start drawing.')).not.toBeInTheDocument();
    unmount();

    gql.list.mockReturnValue({
      data: { projectWorkflows: [] },
      loading: true,
      error: undefined,
      refetch: gql.refetch,
    });
    renderPage();
    expect(screen.getByText('No workflows yet. Create one to start drawing.')).toBeInTheDocument();
  });

  it('shows why the list could not load', () => {
    gql.list.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Network down'),
      refetch: gql.refetch,
    });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
  });

  it('deletes a workflow only after it is confirmed', async () => {
    renderPage();
    const row = screen.getByText('Bug triage').closest('tr') as HTMLElement;

    gql.confirm.mockResolvedValueOnce(false);
    await userEvent.click(within(row).getByRole('button', { name: 'delete' }));
    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Delete the workflow "{name}"?',
      messageValues: { name: 'Bug triage' },
      confirmText: 'Delete',
    });
    expect(gql.remove).not.toHaveBeenCalled();

    await userEvent.click(within(row).getByRole('button', { name: 'delete' }));
    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith('wf-1'));
  });

  it('creates a workflow and opens it in the designer', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New workflow' }));
    expect(await screen.findByText('New workflow form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Submit details' }));

    expect(gql.create).toHaveBeenCalledWith(STUB_DETAILS);
    await waitFor(() => expect(url()).toBe('/projects/workflows/wf-new'));
  });

  it('stays on the list when the create fails, and closes the form on cancel', async () => {
    gql.create.mockResolvedValue(null);
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New workflow' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Submit details' }));
    expect(url()).toBe('/projects/workflows');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel details' }));
    await waitFor(() => expect(screen.queryByText('New workflow form')).not.toBeInTheDocument());
  });

  it('closes the create panel from its close button', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'New workflow' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('New workflow form')).not.toBeInTheDocument());
  });

  it('reloads the list on request', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
