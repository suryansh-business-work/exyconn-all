import { describe, expect, it } from 'vitest';
import { MarkerType } from '@xyflow/react';
import { WorkflowNodeKind } from '@exyconn/shell/graphql/generated';
import {
  WORKFLOW_KINDS,
  WORKFLOW_KIND_ORDER,
  newEdge,
  newKey,
  newNode,
  toFlow,
  toGraphInput,
} from '../../../../../src/pages/workflows/editor/workflow-graph';
import { flowEdge, flowNode, workflowFixture } from '../workflow-fixtures';

const ARROW = { markerEnd: { type: MarkerType.ArrowClosed }, type: 'smoothstep' };

describe('workflow-graph', () => {
  it('offers every kind the schema has, Start first and End last', () => {
    expect(WORKFLOW_KIND_ORDER).toEqual([
      WorkflowNodeKind.Start,
      WorkflowNodeKind.Step,
      WorkflowNodeKind.Decision,
      WorkflowNodeKind.End,
    ]);
    expect(Object.keys(WORKFLOW_KINDS).sort((a, b) => a.localeCompare(b))).toEqual(
      [...WORKFLOW_KIND_ORDER].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('hands out a different key every time', () => {
    const keys = new Set([newKey(), newKey(), newKey()]);
    expect(keys.size).toBe(3);
  });

  it('names a new box after its kind and drops it where it was asked', () => {
    const node = newNode(WorkflowNodeKind.Decision, { x: 10, y: 240 });

    expect(node).toEqual({
      id: expect.any(String),
      type: 'step',
      position: { x: 10, y: 240 },
      data: { kind: WorkflowNodeKind.Decision, label: 'Decision' },
    });
  });

  it('draws a new arrow unlabelled, with a head', () => {
    expect(newEdge('a', 'b')).toEqual({
      id: expect.any(String),
      source: 'a',
      target: 'b',
      label: '',
      ...ARROW,
    });
  });

  it('turns a saved drawing into boxes and arrows', () => {
    const { nodes, edges } = toFlow(workflowFixture());

    expect(nodes[1]).toEqual({
      id: 'n-review',
      type: 'step',
      position: { x: 0, y: 120 },
      data: { kind: WorkflowNodeKind.Step, label: 'Review' },
    });
    expect(edges[1]).toEqual({
      id: 'e-2',
      source: 'n-review',
      target: 'n-end',
      label: 'Approved',
      ...ARROW,
    });
    expect(nodes).toHaveLength(3);
    expect(edges).toHaveLength(2);
  });

  it('stores whole-pixel positions, and an empty label for one that is not text', () => {
    const graph = toGraphInput(
      [flowNode('a', WorkflowNodeKind.Start, { position: { x: 10.4, y: 99.6 } })],
      [flowEdge('e-1', 'a', 'b', 'Yes'), flowEdge('e-2', 'a', 'c'), flowEdge('e-3', 'a', 'd', 7)],
    );

    expect(graph.nodes).toEqual([
      { key: 'a', kind: WorkflowNodeKind.Start, label: 'a', x: 10, y: 100 },
    ]);
    expect(graph.edges.map((edge) => edge.label)).toEqual(['Yes', '', '']);
    expect(graph.edges[0]).toEqual({ key: 'e-1', source: 'a', target: 'b', label: 'Yes' });
  });
});
