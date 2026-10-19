import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Edge } from '@xyflow/react';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { WorkflowInspector } from '../../../../../src/pages/workflows/editor/WorkflowInspector';
import type { WorkflowFlowNode } from '../../../../../src/pages/workflows/editor/workflow-graph';
import { renderWithProviders } from '../../../test-utils';
import { fill, press } from '../../../helpers/form-helpers';
import { flowEdge, flowNode } from '../workflow-fixtures';

const handlers = {
  onRename: vi.fn(),
  onLabelEdge: vi.fn(),
  onRemove: vi.fn(),
  onDeselect: vi.fn(),
};

const renderInspector = (node: WorkflowFlowNode | null, edge: Edge | null) =>
  renderWithProviders(<WorkflowInspector node={node} edge={edge} {...handlers} />);

describe('WorkflowInspector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains the canvas when nothing is selected', () => {
    renderInspector(null, null);

    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(
      screen.getByText('Select a box or a connection to name it; press Delete to remove it.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('names the selected box with its kind and renames it', async () => {
    renderInspector(flowNode('n-1', WorkflowNodeKind.Decision, { data: { kind: WorkflowNodeKind.Decision, label: 'Is it a bug?' } }), null);

    expect(screen.getByRole('heading', { name: 'Decision' })).toBeInTheDocument();
    expect(screen.getByText('A fork. Label each way out with its answer.')).toBeInTheDocument();
    expect(screen.getByLabelText('Step name')).toHaveValue('Is it a bug?');

    fill('Step name', 'Reproducible?');
    await press('Apply');

    await waitFor(() => expect(handlers.onRename).toHaveBeenCalledWith('n-1', 'Reproducible?'));
  });

  it('removes the box or lets it go', async () => {
    renderInspector(flowNode('n-1'), null);

    await press('Remove');
    await press('Cancel');

    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
    expect(handlers.onDeselect).toHaveBeenCalledTimes(1);
  });

  it('prefers the box when both a box and an arrow are selected', () => {
    renderInspector(flowNode('n-1'), flowEdge('e-1', 'a', 'b', 'Yes'));

    expect(screen.getByLabelText('Step name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Connection label')).not.toBeInTheDocument();
  });

  it('labels the selected arrow, starting from its words', async () => {
    renderInspector(null, flowEdge('e-1', 'a', 'b', 'Yes'));

    expect(screen.getByRole('heading', { name: 'Connection' })).toBeInTheDocument();
    expect(screen.getByLabelText('Connection label')).toHaveValue('Yes');

    fill('Connection label', 'Approved');
    await press('Apply');

    await waitFor(() => expect(handlers.onLabelEdge).toHaveBeenCalledWith('e-1', 'Approved'));
    await press('Remove');
    expect(handlers.onRemove).toHaveBeenCalledTimes(1);
  });

  it('starts an arrow whose label is not text from blank', () => {
    renderInspector(null, flowEdge('e-1', 'a', 'b'));

    expect(screen.getByLabelText('Connection label')).toHaveValue('');
  });
});
