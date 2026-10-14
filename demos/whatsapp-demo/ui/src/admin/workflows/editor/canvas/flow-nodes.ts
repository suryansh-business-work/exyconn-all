/**
 * The canvas's React Flow nodes, derived from the stored graph. React Flow measures each node
 * and tracks drags on its own copy; those are carried over from the previous copy so a graph
 * edit elsewhere (an Apply in the inspector) never makes a node blink or jump.
 */
import type { Node } from '@xyflow/react';
import type { GraphIssue, WaGraph, WaNode } from '@exyconn/wa-flow';

export interface WaFlowNodeData extends Record<string, unknown> {
  node: WaNode;
  isStart: boolean;
  errors: number;
  warnings: number;
  /** An AI node while OpenAI is not configured. */
  aiMissing: boolean;
}

export type WaFlowNode = Node<WaFlowNodeData>;

export interface IssueCount {
  errors: number;
  warnings: number;
}

/** Errors and warnings per node id. */
export function countIssues(issues: readonly GraphIssue[]): ReadonlyMap<string, IssueCount> {
  const counts = new Map<string, IssueCount>();
  for (const issue of issues) {
    if (issue.nodeId) {
      const count = counts.get(issue.nodeId) ?? { errors: 0, warnings: 0 };
      if (issue.severity === 'error') {
        count.errors += 1;
      } else {
        count.warnings += 1;
      }
      counts.set(issue.nodeId, count);
    }
  }
  return counts;
}

export interface FlowView {
  selectedId: string | null;
  issues: ReadonlyMap<string, IssueCount>;
  aiConfigured: boolean;
}

export function toFlowNodes(
  graph: WaGraph,
  view: FlowView,
  previous: readonly WaFlowNode[],
): WaFlowNode[] {
  const before = new Map(previous.map((n) => [n.id, n]));
  return graph.nodes.map((node) => {
    const prior = before.get(node.id);
    const count = view.issues.get(node.id);
    return {
      id: node.id,
      type: node.type,
      position: prior?.dragging ? prior.position : node.position,
      measured: prior?.measured,
      dragging: prior?.dragging,
      selected: node.id === view.selectedId,
      data: {
        node,
        isStart: node.id === graph.start,
        errors: count?.errors ?? 0,
        warnings: count?.warnings ?? 0,
        aiMissing: node.type === 'ai' && !view.aiConfigured,
      },
    };
  });
}
