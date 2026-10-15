/**
 * Pure edits on a workflow graph. The editor keeps the stored `WaGraph` as its only state and
 * every canvas or inspector action goes through one of these, so what is saved is exactly
 * what is drawn.
 */
import {
  outputHandles,
  type NodeType,
  type WaEdge,
  type WaGraph,
  type WaNode,
} from '@exyconn/wa-flow';
import { defaultNodeData } from './node-defaults';

export interface Position {
  x: number;
  y: number;
}

/** `<type>-<n>`, the first one not taken. */
export function newNodeId(graph: WaGraph, type: NodeType): string {
  const taken = new Set(graph.nodes.map((n) => n.id));
  let n = graph.nodes.length + 1;
  while (taken.has(`${type}-${n}`)) {
    n += 1;
  }
  return `${type}-${n}`;
}

/** Adds a node of `type` with valid default data; the first node becomes the start. */
export function addNode(
  graph: WaGraph,
  type: NodeType,
  position: Position,
  workflowKeys: readonly string[],
): { graph: WaGraph; id: string } {
  const id = newNodeId(graph, type);
  const node = { id, type, position, data: defaultNodeData(type, workflowKeys) } as WaNode;
  const start = graph.nodes.length === 0 ? id : graph.start;
  return { graph: { ...graph, start, nodes: [...graph.nodes, node] }, id };
}

/** Removes nodes and every edge touching them; a removed start passes to the first node left. */
export function removeNodes(graph: WaGraph, ids: readonly string[]): WaGraph {
  const gone = new Set(ids);
  const nodes = graph.nodes.filter((n) => !gone.has(n.id));
  const edges = graph.edges.filter((e) => !gone.has(e.source) && !gone.has(e.target));
  const start = gone.has(graph.start) ? (nodes[0]?.id ?? '') : graph.start;
  return { start, nodes, edges };
}

export function removeEdges(graph: WaGraph, ids: readonly string[]): WaGraph {
  const gone = new Set(ids);
  return { ...graph, edges: graph.edges.filter((e) => !gone.has(e.id)) };
}

/** Wires one output to a node. An output leads to one node only, so an old edge is replaced. */
export function connect(
  graph: WaGraph,
  link: Readonly<{ source: string; sourceHandle: string; target: string }>,
): WaGraph {
  const edge: WaEdge = { id: `${link.source}--${link.sourceHandle}`, ...link };
  const edges = graph.edges.filter(
    (e) => !(e.source === link.source && e.sourceHandle === link.sourceHandle) && e.id !== edge.id,
  );
  return { ...graph, edges: [...edges, edge] };
}

/**
 * Replaces a node's data. Outputs that no longer exist (a deleted button, a renamed row id)
 * lose their edges, so no wire is left hanging off nothing.
 */
export function updateNodeData(graph: WaGraph, id: string, data: WaNode['data']): WaGraph {
  const nodes = graph.nodes.map((n) => (n.id === id ? ({ ...n, data } as WaNode) : n));
  const updated = nodes.find((n) => n.id === id);
  if (!updated) {
    return graph;
  }
  const handles = new Set(outputHandles(updated).map((h) => h.id));
  const edges = graph.edges.filter((e) => e.source !== id || handles.has(e.sourceHandle));
  return { ...graph, nodes, edges };
}

export function moveNode(graph: WaGraph, id: string, position: Position): WaGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
  };
}

export function setStart(graph: WaGraph, id: string): WaGraph {
  return { ...graph, start: id };
}
