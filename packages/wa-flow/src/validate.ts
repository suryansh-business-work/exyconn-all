/**
 * Checks a workflow graph makes sense as a conversation, beyond its shape (which Zod checks).
 * Any `error` blocks Publish — in the editor and, authoritatively, on the server.
 */
import { outputHandles, waitsForCustomer } from './handles';
import { graphSchema, type WaGraph, type WaNode } from './schema';

export interface GraphIssue {
  severity: 'error' | 'warning';
  /** The node it is about, when there is one. */
  nodeId?: string;
  /** English source with `{placeholders}` — the screen translates it with `values`. */
  message: string;
  values?: Readonly<Record<string, string>>;
}

function duplicateIds(graph: WaGraph): GraphIssue[] {
  const seen = new Set<string>();
  const issues: GraphIssue[] = [];
  for (const node of graph.nodes) {
    if (seen.has(node.id)) {
      issues.push({
        severity: 'error',
        nodeId: node.id,
        message: 'Two nodes share the id "{id}".',
        values: { id: node.id },
      });
    }
    seen.add(node.id);
  }
  return issues;
}

function edgeIssues(graph: WaGraph, byId: ReadonlyMap<string, WaNode>): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const used = new Set<string>();
  for (const edge of graph.edges) {
    const source = byId.get(edge.source);
    if (!source || !byId.has(edge.target)) {
      issues.push({
        severity: 'error',
        nodeId: edge.source,
        message: 'Edge "{id}" points at a node that does not exist.',
        values: { id: edge.id },
      });
      continue;
    }
    if (!outputHandles(source).some((h) => h.id === edge.sourceHandle)) {
      issues.push({
        severity: 'error',
        nodeId: source.id,
        message: 'Edge "{id}" leaves from an output this node does not have.',
        values: { id: edge.id },
      });
    }
    const key = `${edge.source}:${edge.sourceHandle}`;
    if (used.has(key)) {
      issues.push({
        severity: 'error',
        nodeId: source.id,
        message: 'One output is connected to two nodes.',
      });
    }
    used.add(key);
  }
  return issues;
}

function danglingOutputs(graph: WaGraph): GraphIssue[] {
  const wired = new Set(graph.edges.map((e) => `${e.source}:${e.sourceHandle}`));
  return graph.nodes.flatMap((node) =>
    outputHandles(node)
      .filter((h) => !wired.has(`${node.id}:${h.id}`))
      .filter((h) => h.interactive || h.id === 'fallback' || node.type === 'input')
      .map<GraphIssue>((h) => ({
        severity: 'error',
        nodeId: node.id,
        message: '"{label}" is not connected to anything.',
        values: { label: h.label },
      })),
  );
}

function reachable(graph: WaGraph): Set<string> {
  const seen = new Set<string>();
  const queue = [graph.start];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (!seen.has(current)) {
      seen.add(current);
      queue.push(...graph.edges.filter((e) => e.source === current).map((e) => e.target));
    }
  }
  return seen;
}

function deadEnds(graph: WaGraph): GraphIssue[] {
  const hasOut = new Set(graph.edges.map((e) => e.source));
  return graph.nodes
    .filter((n) => !hasOut.has(n.id) && outputHandles(n).length > 0 && !waitsForCustomer(n))
    .map((n) => ({
      severity: 'warning' as const,
      nodeId: n.id,
      message: 'The conversation stops here. End it with an End node to offer the menu.',
    }));
}

/**
 * Every problem with a graph. `workflowKeys` is the demo's workflow keys, so a Jump to a
 * workflow that does not exist is caught; leave it out to skip that check.
 */
export function validateGraph(graph: WaGraph, workflowKeys?: readonly string[]): GraphIssue[] {
  const parsed = graphSchema.safeParse(graph);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => ({
      severity: 'error',
      message: '{path}: {problem}',
      values: { path: i.path.join('.'), problem: i.message },
    }));
  }
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const issues: GraphIssue[] = [...duplicateIds(graph)];
  if (!byId.has(graph.start)) {
    issues.push({ severity: 'error', message: 'The workflow has no start node.' });
    return issues;
  }
  issues.push(...edgeIssues(graph, byId), ...danglingOutputs(graph), ...deadEnds(graph));
  const seen = reachable(graph);
  for (const node of graph.nodes.filter((n) => !seen.has(n.id))) {
    issues.push({ severity: 'warning', nodeId: node.id, message: 'Nothing leads to this node.' });
  }
  if (workflowKeys) {
    const keys = new Set(workflowKeys);
    for (const node of graph.nodes) {
      if (node.type === 'jump' && !keys.has(node.data.workflowKey)) {
        issues.push({
          severity: 'error',
          nodeId: node.id,
          message: 'There is no workflow "{key}" to jump to.',
          values: { key: node.data.workflowKey },
        });
      }
    }
  }
  return issues;
}

/** True when nothing blocks publishing. */
export function isPublishable(issues: readonly GraphIssue[]): boolean {
  return issues.every((i) => i.severity !== 'error');
}
