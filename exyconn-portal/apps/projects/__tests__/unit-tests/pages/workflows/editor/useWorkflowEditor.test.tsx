import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { useWorkflowEditor } from '../../../../../src/pages/workflows/editor/useWorkflowEditor';
import { renderHookWithProviders } from '../../../test-utils';
import { workflowFixture } from '../workflow-fixtures';

const gql = vi.hoisted(() => ({
  query: vi.fn(),
  save: vi.fn(),
  saving: false,
  notify: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectWorkflowQuery: (options: unknown) => gql.query(options),
  useSaveProjectWorkflowGraphMutation: () => [gql.save, { loading: gql.saving }],
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

const loaded = (workflow = workflowFixture()) => ({
  data: { projectWorkflow: workflow },
  loading: false,
  error: undefined,
});

const renderEditor = (id = 'wf-1') => renderHookWithProviders(() => useWorkflowEditor(id));

describe('useWorkflowEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.saving = false;
    gql.save.mockResolvedValue({ data: {} });
    gql.query.mockReturnValue(loaded());
  });

  it('loads the saved drawing once, clean, asking the network for the workflow', () => {
    const { result } = renderEditor();

    expect(gql.query).toHaveBeenCalledWith({
      variables: { id: 'wf-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(result.current.workflow?.name).toBe('Bug triage');
    expect(result.current.nodes.map((node) => node.id)).toEqual(['n-start', 'n-review', 'n-end']);
    expect(result.current.edges.map((edge) => edge.id)).toEqual(['e-1', 'e-2']);
    expect(result.current.dirty).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasStart).toBe(true);
    expect(result.current.selectedNode).toBeNull();
    expect(result.current.selectedEdge).toBeNull();
  });

  it('is loading before the first answer and skips without an id', () => {
    gql.query.mockReturnValue({ data: undefined, loading: true, error: undefined });
    const { result } = renderEditor('');

    expect(gql.query).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
    expect(result.current.loading).toBe(true);
    expect(result.current.workflow).toBeNull();
    expect(result.current.nodes).toEqual([]);
    expect(result.current.hasStart).toBe(false);
  });

  it('is not loading while it refreshes a workflow it already has, and passes on errors', () => {
    const error = new Error('Not found');
    gql.query.mockReturnValue({ ...loaded(), loading: true, error });
    const { result } = renderEditor();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
  });

  it('never overwrites unsaved work when the same workflow comes back', () => {
    const { result, rerender } = renderEditor();
    act(() => result.current.renameNode('n-review', 'Triage'));

    gql.query.mockReturnValue(loaded(workflowFixture({ name: 'Bug triage v2' })));
    rerender();

    expect(result.current.nodes[1].data.label).toBe('Triage');
    expect(result.current.dirty).toBe(true);
  });

  it('loads afresh, clean, when a different workflow arrives', () => {
    const { result, rerender } = renderEditor();
    act(() => result.current.renameNode('n-review', 'Triage'));

    gql.query.mockReturnValue(
      loaded(workflowFixture({ id: 'wf-2', nodes: [], edges: [] })),
    );
    rerender();

    expect(result.current.nodes).toEqual([]);
    expect(result.current.dirty).toBe(false);
  });

  it('counts moving a box as an edit, but not selecting or measuring one', () => {
    const { result } = renderEditor();

    act(() =>
      result.current.onNodesChange([
        { type: 'select', id: 'n-review', selected: true },
        { type: 'dimensions', id: 'n-review', dimensions: { width: 200, height: 60 } },
      ]),
    );
    expect(result.current.dirty).toBe(false);
    expect(result.current.selectedNode?.id).toBe('n-review');

    act(() =>
      result.current.onNodesChange([
        { type: 'position', id: 'n-review', position: { x: 40, y: 130 } },
      ]),
    );
    expect(result.current.dirty).toBe(true);
    expect(result.current.nodes[1].position).toEqual({ x: 40, y: 130 });
  });

  it('counts removing an arrow as an edit, but not selecting one', () => {
    const { result } = renderEditor();

    act(() => result.current.onEdgesChange([{ type: 'select', id: 'e-2', selected: true }]));
    expect(result.current.dirty).toBe(false);
    expect(result.current.selectedEdge?.id).toBe('e-2');

    act(() => result.current.onEdgesChange([{ type: 'remove', id: 'e-2' }]));
    expect(result.current.dirty).toBe(true);
    expect(result.current.edges.map((edge) => edge.id)).toEqual(['e-1']);
  });

  it('joins two boxes once, skipping a second arrow between the same pair', () => {
    const { result } = renderEditor();
    const join = { source: 'n-start', target: 'n-end', sourceHandle: null, targetHandle: null };

    act(() => result.current.onConnect(join));
    act(() => result.current.onConnect(join));

    const joins = result.current.edges.filter(
      (edge) => edge.source === 'n-start' && edge.target === 'n-end',
    );
    expect(joins).toHaveLength(1);
    expect(joins[0].label).toBe('');
    expect(result.current.edges).toHaveLength(3);
    expect(result.current.dirty).toBe(true);
  });

  it('drops a new box below the lowest one, selected on its own', () => {
    const { result } = renderEditor();
    act(() => result.current.onNodesChange([{ type: 'select', id: 'n-start', selected: true }]));

    act(() => result.current.addNode(WorkflowNodeKind.Decision));

    const added = result.current.nodes.at(-1);
    expect(added?.position).toEqual({ x: 0, y: 360 });
    expect(added?.data).toEqual({ kind: WorkflowNodeKind.Decision, label: 'Decision' });
    expect(result.current.selectedNode).toBe(added);
    expect(result.current.nodes.filter((node) => node.selected)).toHaveLength(1);
    expect(result.current.dirty).toBe(true);
  });

  it('puts the first box on an empty canvas at the top', () => {
    gql.query.mockReturnValue(loaded(workflowFixture({ nodes: [], edges: [] })));
    const { result } = renderEditor();

    act(() => result.current.addNode(WorkflowNodeKind.Start));

    expect(result.current.nodes[0].position).toEqual({ x: 0, y: 0 });
    expect(result.current.hasStart).toBe(true);
  });

  it('renames only the box asked for', () => {
    const { result } = renderEditor();

    act(() => result.current.renameNode('n-review', 'Triage'));

    expect(result.current.nodes.map((node) => node.data.label)).toEqual([
      'Start',
      'Triage',
      'Done',
    ]);
    expect(result.current.dirty).toBe(true);
  });

  it('labels only the arrow asked for', () => {
    const { result } = renderEditor();

    act(() => result.current.labelEdge('e-1', 'Begin'));

    expect(result.current.edges.map((edge) => edge.label)).toEqual(['Begin', 'Approved']);
    expect(result.current.dirty).toBe(true);
  });

  it('removes the selected box with every arrow into or out of it', () => {
    const { result } = renderEditor();
    act(() => result.current.onNodesChange([{ type: 'select', id: 'n-review', selected: true }]));

    act(() => result.current.removeSelected());

    expect(result.current.nodes.map((node) => node.id)).toEqual(['n-start', 'n-end']);
    expect(result.current.edges).toEqual([]);
    expect(result.current.dirty).toBe(true);
  });

  it('removes a selected arrow and leaves the boxes and other arrows alone', () => {
    const { result } = renderEditor();
    act(() => result.current.onEdgesChange([{ type: 'select', id: 'e-1', selected: true }]));

    act(() => result.current.removeSelected());

    expect(result.current.nodes).toHaveLength(3);
    expect(result.current.edges.map((edge) => edge.id)).toEqual(['e-2']);
  });

  it('drops arrows whose target box went, too', () => {
    const { result } = renderEditor();
    act(() => result.current.onNodesChange([{ type: 'select', id: 'n-end', selected: true }]));

    act(() => result.current.removeSelected());

    expect(result.current.edges.map((edge) => edge.id)).toEqual(['e-1']);
  });

  it('clears every selection without marking the drawing changed', () => {
    const { result } = renderEditor();
    act(() => {
      result.current.onNodesChange([{ type: 'select', id: 'n-review', selected: true }]);
      result.current.onEdgesChange([{ type: 'select', id: 'e-1', selected: true }]);
    });

    act(() => result.current.deselect());

    expect(result.current.selectedNode).toBeNull();
    expect(result.current.selectedEdge).toBeNull();
    expect(result.current.dirty).toBe(false);
  });

  it('saves the whole drawing, then is clean again', async () => {
    const { result } = renderEditor();
    act(() => result.current.renameNode('n-review', 'Triage'));

    await act(() => result.current.save());

    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        id: 'wf-1',
        graph: {
          nodes: [
            { key: 'n-start', kind: WorkflowNodeKind.Start, label: 'Start', x: 0, y: 0 },
            { key: 'n-review', kind: WorkflowNodeKind.Step, label: 'Triage', x: 0, y: 120 },
            { key: 'n-end', kind: WorkflowNodeKind.End, label: 'Done', x: 0, y: 240 },
          ],
          edges: [
            { key: 'e-1', source: 'n-start', target: 'n-review', label: '' },
            { key: 'e-2', source: 'n-review', target: 'n-end', label: 'Approved' },
          ],
        },
      },
    });
    expect(result.current.dirty).toBe(false);
    expect(gql.notify).toHaveBeenCalledWith('Workflow saved');
  });

  it('keeps the changes and says why when the server refuses the drawing', async () => {
    gql.save.mockRejectedValue(new Error('A workflow needs exactly one Start'));
    const { result } = renderEditor();
    act(() => result.current.renameNode('n-review', 'Triage'));

    await act(() => result.current.save());

    expect(result.current.dirty).toBe(true);
    expect(gql.notify).toHaveBeenCalledWith('A workflow needs exactly one Start', 'error');
  });

  it('falls back to a plain message for a failure that is not an Error', async () => {
    gql.save.mockRejectedValue('offline');
    const { result } = renderEditor();

    await act(() => result.current.save());

    expect(gql.notify).toHaveBeenCalledWith('Could not save the workflow', 'error');
  });

  it('passes on whether a save is running', () => {
    gql.saving = true;
    const { result } = renderEditor();
    expect(result.current.saving).toBe(true);
  });
});
