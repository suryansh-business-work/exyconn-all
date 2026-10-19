import type { Edge } from '@xyflow/react';
import {
  WorkflowNodeKind,
  type ProjectWorkflowQuery,
  type ProjectWorkflowSummaryFragment,
} from '@exyconn/shell/graphql/generated';
import type { WorkflowFlowNode } from '../../../../src/pages/workflows/editor/workflow-graph';

export type WorkflowFixture = ProjectWorkflowQuery['projectWorkflow'];

/** A saved workflow: Start -> Review -> End, the review's way out labelled "Approved". */
export function workflowFixture(overrides: Partial<WorkflowFixture> = {}): WorkflowFixture {
  return {
    __typename: 'ProjectWorkflow',
    id: 'wf-1',
    name: 'Bug triage',
    description: 'How a reported bug is sorted',
    createdByName: 'Asha Rao',
    updatedByName: 'Priya',
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-03T10:30:00.000Z',
    nodes: [
      { __typename: 'WorkflowNode', key: 'n-start', kind: WorkflowNodeKind.Start, label: 'Start', x: 0, y: 0 },
      { __typename: 'WorkflowNode', key: 'n-review', kind: WorkflowNodeKind.Step, label: 'Review', x: 0, y: 120 },
      { __typename: 'WorkflowNode', key: 'n-end', kind: WorkflowNodeKind.End, label: 'Done', x: 0, y: 240 },
    ],
    edges: [
      { __typename: 'WorkflowEdge', key: 'e-1', source: 'n-start', target: 'n-review', label: '' },
      { __typename: 'WorkflowEdge', key: 'e-2', source: 'n-review', target: 'n-end', label: 'Approved' },
    ],
    ...overrides,
  };
}

/** One row of the workflow list. */
export function workflowSummary(
  overrides: Partial<ProjectWorkflowSummaryFragment> = {},
): ProjectWorkflowSummaryFragment {
  return {
    __typename: 'ProjectWorkflow',
    id: 'wf-1',
    name: 'Bug triage',
    description: 'How a reported bug is sorted',
    createdByName: 'Asha Rao',
    updatedByName: 'Priya',
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-03T10:30:00.000Z',
    ...overrides,
  };
}

/** A box on the canvas. */
export function flowNode(
  id: string,
  kind: WorkflowNodeKind = WorkflowNodeKind.Step,
  overrides: Partial<WorkflowFlowNode> = {},
): WorkflowFlowNode {
  return {
    id,
    type: 'step',
    position: { x: 0, y: 0 },
    data: { kind, label: id },
    ...overrides,
  };
}

/** An arrow on the canvas. */
export function flowEdge(id: string, source: string, target: string, label?: Edge['label']): Edge {
  return { id, source, target, label };
}
