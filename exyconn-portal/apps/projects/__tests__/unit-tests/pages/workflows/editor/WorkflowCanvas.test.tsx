import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import { WorkflowCanvas } from '../../../../../src/pages/workflows/editor/WorkflowCanvas';
import { WorkflowNode } from '../../../../../src/pages/workflows/editor/WorkflowNode';
import { renderWithProviders } from '../../../test-utils';
import { flowEdge, flowNode } from '../workflow-fixtures';

const flow = vi.hoisted(() => ({ props: {} as Record<string, unknown>, miniMap: '' }));

// jsdom cannot measure or drag, so React Flow is stubbed and the test reads what it was given.
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ReactFlow: (props: Readonly<Record<string, unknown> & { children?: ReactNode }>) => {
    flow.props = props;
    return <div data-testid="flow">{props.children}</div>;
  },
  Background: () => null,
  Controls: () => null,
  MiniMap: ({ ariaLabel }: Readonly<{ ariaLabel: string }>) => {
    flow.miniMap = ariaLabel;
    return null;
  },
}));

describe('WorkflowCanvas', () => {
  it('hands React Flow the drawing, the handlers and the box type', () => {
    const nodes = [flowNode('a')];
    const edges = [flowEdge('e-1', 'a', 'b')];
    const onNodesChange = vi.fn();
    const onEdgesChange = vi.fn();
    const onConnect = vi.fn();

    renderWithProviders(
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />,
    );

    expect(screen.getByRole('region', { name: 'Workflow canvas' })).toContainElement(
      screen.getByTestId('flow'),
    );
    expect(flow.props).toMatchObject({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      nodeTypes: { step: WorkflowNode },
      deleteKeyCode: ['Backspace', 'Delete'],
      colorMode: 'light',
      fitView: true,
    });
    expect(flow.miniMap).toBe('Workflow overview');
  });
});
