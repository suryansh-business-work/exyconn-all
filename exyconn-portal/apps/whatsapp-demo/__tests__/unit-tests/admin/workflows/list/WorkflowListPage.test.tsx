import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowListPage } from '../../../../../src/admin/workflows/list';
import type { DemoRow, WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { demoRow, workflowRow } from '../../admin.fixtures';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

interface QueryState<T> {
  data?: T;
  error?: Error;
  loading: boolean;
  refetch: () => Promise<unknown>;
}

const hooks = vi.hoisted(() => ({
  demos: {} as QueryState<{ whatsappDemos: DemoRow[] }>,
  workflows: {} as QueryState<{ whatsappWorkflows: WorkflowRow[] }>,
  workflowOptions: [] as { variables: { demoId: string }; skip: boolean }[],
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemosQuery: () => hooks.demos,
  useWhatsappWorkflowsQuery: (options: { variables: { demoId: string }; skip: boolean }) => {
    hooks.workflowOptions.push(options);
    return hooks.workflows;
  },
}));

vi.mock('../../../../../src/admin/workflows/forms/demo-profile', () => ({
  DemoProfileForm: (
    props: Readonly<{ demo: DemoRow | null; onSaved: (id: string) => void; onCancel: () => void }>,
  ) => (
    <div>
      <p>{`profile for ${props.demo?.id ?? 'a new demo'}`}</p>
      <button type="button" onClick={() => props.onSaved('demo-2')}>
        Save profile
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel profile
      </button>
    </div>
  ),
}));
vi.mock('../../../../../src/admin/workflows/list/WorkflowsTable', () => ({
  WorkflowsTable: (props: Readonly<{ rows: WorkflowRow[]; loading: boolean }>) => (
    <p>{`table rows=${props.rows.length} loading=${String(props.loading)}`}</p>
  ),
}));
vi.mock('../../../../../src/admin/workflows/list/NewWorkflowDialog', () => ({
  NewWorkflowDialog: (
    props: Readonly<{ open: boolean; demoId: string; nextOrder: number; onClose: () => void }>,
  ) =>
    props.open ? (
      <div>
        <p>{`new workflow in ${props.demoId} at ${props.nextOrder}`}</p>
        <button type="button" onClick={props.onClose}>
          Close new workflow
        </button>
      </div>
    ) : null,
}));

const DEMOS = [demoRow(), demoRow({ id: 'demo-2', key: 'salon', industry: 'Beauty' })];

function UrlProbe() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

function renderPage(route = '/admin/bot-workflows') {
  renderWithProviders(
    <>
      <WorkflowListPage />
      <UrlProbe />
    </>,
    { route },
  );
  return userEvent.setup();
}

beforeEach(() => {
  hooks.demos = { data: { whatsappDemos: DEMOS }, loading: false, refetch: vi.fn() };
  hooks.workflows = {
    data: { whatsappWorkflows: [workflowRow(), workflowRow({ id: 'wf-2' })] },
    loading: false,
    refetch: vi.fn(),
  };
  hooks.workflowOptions = [];
});
afterEach(() => vi.clearAllMocks());

describe('WorkflowListPage', () => {
  it('waits for the demos to load', () => {
    hooks.demos = { loading: true, refetch: vi.fn() };
    renderPage();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says the demos could not load and retries', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    hooks.demos = { error: new Error('Network down'), loading: false, refetch };
    const user = renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the demos. Network down');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("lists the first demo's workflows by default", () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Bot workflows' })).toBeInTheDocument();
    expect(document.title).toContain('Bot workflows');
    expect(screen.getByText('table rows=2 loading=false')).toBeInTheDocument();
    expect(hooks.workflowOptions.at(-1)).toEqual({ variables: { demoId: 'demo-1' }, skip: false });
  });

  it('lists the demo named in the URL', () => {
    renderPage('/admin/bot-workflows?demo=demo-2');
    expect(hooks.workflowOptions.at(-1)).toEqual({ variables: { demoId: 'demo-2' }, skip: false });
  });

  it('shows loading rows until the first answer arrives', () => {
    hooks.workflows = { loading: true, refetch: vi.fn() };
    renderPage();
    expect(screen.getByText('table rows=0 loading=true')).toBeInTheDocument();
  });

  it('says the workflows could not load instead of the table', () => {
    hooks.workflows = { error: new Error('Timed out'), loading: false, refetch: vi.fn() };
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the workflows. Timed out');
    expect(screen.queryByText(/table rows/)).not.toBeInTheDocument();
  });

  it('switches demo from the picker and keeps it in the URL', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('combobox', { name: /Demo/ }));
    await user.click(screen.getByRole('option', { name: /Beauty/ }));
    expect(screen.getByTestId('url')).toHaveTextContent('/admin/bot-workflows?demo=demo-2');
    expect(hooks.workflowOptions.at(-1)?.variables.demoId).toBe('demo-2');
  });

  it("edits the chosen demo's profile and returns to the list on cancel", async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'Business profile' }));
    expect(screen.getByText('profile for demo-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel profile' }));
    expect(screen.queryByText(/profile for/)).not.toBeInTheDocument();
  });

  it('opens the saved demo after a new profile is saved', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'New demo' }));
    expect(screen.getByText('profile for a new demo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(screen.queryByText(/profile for/)).not.toBeInTheDocument();
    expect(screen.getByTestId('url')).toHaveTextContent('?demo=demo-2');
  });

  it('creates a workflow at the end of the menu', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'New workflow' }));
    expect(screen.getByText('new workflow in demo-1 at 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close new workflow' }));
    expect(screen.queryByText(/new workflow in/)).not.toBeInTheDocument();
  });

  it('invites the first demo when there are none', async () => {
    hooks.demos = { data: { whatsappDemos: [] }, loading: false, refetch: vi.fn() };
    const user = renderPage();
    expect(screen.getByText('No demos yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New workflow' })).toBeDisabled();
    expect(hooks.workflowOptions.at(-1)).toEqual({ variables: { demoId: '' }, skip: true });
    const [, emptyStateAction] = screen.getAllByRole('button', { name: 'New demo' });
    await user.click(emptyStateAction);
    expect(screen.getByText('profile for a new demo')).toBeInTheDocument();
    expect(screen.queryByText('No demos yet.')).not.toBeInTheDocument();
  });

  it('treats a demo id that no longer exists as no demo', () => {
    renderPage('/admin/bot-workflows?demo=gone');
    expect(screen.getByText('No demos yet.')).toBeInTheDocument();
    expect(screen.queryByText(/table rows/)).not.toBeInTheDocument();
    expect(hooks.workflowOptions.at(-1)).toEqual({ variables: { demoId: 'gone' }, skip: true });
  });
});
