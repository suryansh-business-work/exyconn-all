import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowEditorPage } from '../../../../../src/admin/workflows';
import type { WorkflowEditor } from '../../../../../src/admin/workflows/editor/useWorkflowEditor';
import type { DemoRow, WorkflowRow } from '../../../../../src/admin/workflows/model/api';
import { renderWithProviders } from '../../../test-utils';
import { SAMPLE_GRAPH, demoRow, workflowRow } from '../../admin.fixtures';

interface WorkspaceProps {
  workflow: WorkflowRow;
  demo: DemoRow | undefined;
  siblings: readonly WorkflowRow[] | undefined;
  aiConfigured: boolean;
  editor: WorkflowEditor;
}

const api = vi.hoisted(() => ({
  workflow: { data: undefined as unknown, loading: false, error: undefined as unknown },
  workflowOptions: null as unknown,
  siblings: undefined as unknown,
  siblingOptions: null as unknown,
  ai: undefined as unknown,
  demos: undefined as unknown,
  refetch: vi.fn(),
  workspace: null as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappWorkflowQuery: (options: unknown) => {
    api.workflowOptions = options;
    return { ...api.workflow, refetch: api.refetch };
  },
  useWhatsappWorkflowsQuery: (options: unknown) => {
    api.siblingOptions = options;
    return { data: api.siblings };
  },
  useWhatsappDemosQuery: () => ({ data: api.demos }),
  useWhatsappDemoAiStatusQuery: () => ({ data: api.ai }),
}));
vi.mock('../../../../../src/admin/workflows/editor/EditorWorkspace', () => ({
  EditorWorkspace: (props: Readonly<WorkspaceProps>) => {
    api.workspace = props;
    return <p>{`Workspace for ${props.workflow.name}`}</p>;
  },
}));

const workspace = () => api.workspace as WorkspaceProps;
const ROUTE = { route: '/admin/bot-workflows/wf-1', path: '/admin/bot-workflows/:workflowId' };

beforeEach(() => {
  api.workflow = { data: undefined, loading: false, error: undefined };
  api.siblings = undefined;
  api.ai = undefined;
  api.demos = { whatsappDemos: [demoRow({ id: 'other' }), demoRow()] };
  api.workspace = null;
  api.refetch.mockReset().mockResolvedValue({});
});

describe('WorkflowEditorPage', () => {
  it('waits for the workflow, without asking for its siblings yet', () => {
    api.workflow = { data: undefined, loading: true, error: undefined };
    renderWithProviders(<WorkflowEditorPage />, ROUTE);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(api.workflowOptions).toEqual({ variables: { id: 'wf-1' }, skip: false });
    expect(api.siblingOptions).toEqual({ variables: { demoId: undefined }, skip: true });
  });

  it('asks for nothing without a workflow id', () => {
    renderWithProviders(<WorkflowEditorPage />);
    expect(api.workflowOptions).toEqual({ variables: { id: '' }, skip: true });
    expect(screen.getByText('This workflow does not exist.')).toBeInTheDocument();
  });

  it('reports a workflow that failed to load, with a retry', async () => {
    const user = userEvent.setup();
    api.workflow = { data: undefined, loading: false, error: new Error('Broken') };
    renderWithProviders(<WorkflowEditorPage />, ROUTE);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the workflow. Broken');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(api.refetch).toHaveBeenCalledTimes(1);
  });

  it('says so when the workflow is gone', () => {
    api.workflow = { data: { whatsappWorkflow: null }, loading: false, error: undefined };
    renderWithProviders(<WorkflowEditorPage />, ROUTE);
    expect(screen.getByText('This workflow does not exist.')).toBeInTheDocument();
    expect(screen.getByText('It may have been deleted.')).toBeInTheDocument();
  });

  it('opens the editor with its demo, its siblings and the AI status', () => {
    const workflow = workflowRow();
    const siblings = [workflow, workflowRow({ id: 'wf-2', key: 'faq' })];
    api.workflow = { data: { whatsappWorkflow: workflow }, loading: false, error: undefined };
    api.siblings = { whatsappWorkflows: siblings };
    api.ai = { whatsappDemoAiStatus: { configured: false, model: null } };
    renderWithProviders(<WorkflowEditorPage />, ROUTE);

    expect(screen.getByText('Workspace for Book a visit')).toBeInTheDocument();
    expect(document.title).toContain('Edit Book a visit');
    expect(api.siblingOptions).toEqual({ variables: { demoId: 'demo-1' }, skip: false });
    expect(workspace().demo?.id).toBe('demo-1');
    expect(workspace().siblings).toBe(siblings);
    expect(workspace().aiConfigured).toBe(false);
    expect(workspace().editor.graph).toEqual(SAMPLE_GRAPH);
  });

  it('assumes AI is set up until the status arrives, and has no demo or siblings yet', () => {
    api.demos = undefined;
    api.workflow = {
      data: { whatsappWorkflow: workflowRow({ demoId: 'missing' }) },
      loading: true,
      error: undefined,
    };
    renderWithProviders(<WorkflowEditorPage />, ROUTE);
    expect(workspace().aiConfigured).toBe(true);
    expect(workspace().demo).toBeUndefined();
    expect(workspace().siblings).toBeUndefined();
  });
});
