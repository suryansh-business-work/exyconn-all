import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { NodeProps } from '@xyflow/react';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import { WorkflowNode } from '../../../../../src/pages/workflows/editor/WorkflowNode';
import type { WorkflowFlowNode } from '../../../../../src/pages/workflows/editor/workflow-graph';
import { renderWithProviders } from '../../../test-utils';

// A Handle needs a mounted React Flow around it; a marker says which sides a box offers.
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Handle: ({ type, position }: Readonly<{ type: string; position: string }>) => (
    <span data-testid={`handle-${type}`} data-position={position} />
  ),
}));

function renderNode(kind: WorkflowNodeKind, label: string, selected = false) {
  const props: NodeProps<WorkflowFlowNode> = {
    id: 'n-1',
    type: 'step',
    data: { kind, label },
    selected,
    dragging: false,
    draggable: true,
    selectable: true,
    deletable: true,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  };
  return renderWithProviders(<WorkflowNode {...props} />);
}

const box = () => screen.getByText('Review').closest('.MuiBox-root')?.parentElement?.parentElement;

describe('WorkflowNode', () => {
  it('shows the kind and the name, with a way in on top and a way out below', () => {
    renderNode(WorkflowNodeKind.Step, 'Review');

    expect(screen.getByText('Step')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByTestId('handle-target')).toHaveAttribute('data-position', 'top');
    expect(screen.getByTestId('handle-source')).toHaveAttribute('data-position', 'bottom');
    expect(box()).toHaveStyle({ borderStyle: 'solid', borderLeftWidth: '2px' });
  });

  it('gives a Start no way in, and a heavier edge', () => {
    renderNode(WorkflowNodeKind.Start, 'Begin');

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.queryByTestId('handle-target')).not.toBeInTheDocument();
    expect(screen.getByTestId('handle-source')).toBeInTheDocument();
    expect(screen.getByText('Begin').closest('.MuiBox-root')?.parentElement?.parentElement).toHaveStyle(
      { borderLeftWidth: '6px' },
    );
  });

  it('gives an End no way out', () => {
    renderNode(WorkflowNodeKind.End, 'Closed');

    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.getByTestId('handle-target')).toBeInTheDocument();
    expect(screen.queryByTestId('handle-source')).not.toBeInTheDocument();
  });

  it('draws a decision dashed, and a selected box in the primary colour', () => {
    renderNode(WorkflowNodeKind.Decision, 'Review', true);

    expect(screen.getByText('Decision')).toBeInTheDocument();
    expect(box()).toHaveStyle({ borderStyle: 'dashed' });
  });
});
