/**
 * Authoring sugar for the seed industries: write each node with its `next` inline and let
 * `toWorkflowDef` turn that into React Flow edges and a tidy layout. What the server stores
 * (and the editor edits) is always the plain `{ nodes, edges }` graph.
 */
import { HANDLE } from './handles';
import { autoLayout } from './layout';
import type { DemoProfile, NodeOf, NodeType, WaEdge, WaGraph, WaNode, WorkflowDef } from './schema';

/**
 * Where each output goes: a node id for the single `next` output, or a map from output id
 * (button / row / card / case / intent id, or `next`, `later`, `pay`, `else`, `fallback`,
 * `pick`) to node id.
 */
export type AuthorNext = string | Readonly<Record<string, string>>;

export type AuthorNode = {
  [T in NodeType]: { id: string; type: T; data: NodeOf<T>['data']; next?: AuthorNext };
}[NodeType];

export interface SeedWorkflow {
  key: string;
  name: string;
  description: string;
  keywords: readonly string[];
  /** Entry node; the first node when left out. */
  start?: string;
  nodes: readonly AuthorNode[];
}

export interface SeedDemo extends Omit<DemoProfile, 'order' | 'active'> {
  workflows: readonly SeedWorkflow[];
}

/** Identity, for type-checking a demo file. */
export function defineDemo(demo: SeedDemo): SeedDemo {
  return demo;
}

/** Identity, for type-checking a workflow written in its own file. */
export function defineWorkflow(workflow: SeedWorkflow): SeedWorkflow {
  return workflow;
}

function edgesOf(node: AuthorNode): WaEdge[] {
  if (!node.next) {
    return [];
  }
  const targets: Readonly<Record<string, string>> =
    typeof node.next === 'string' ? { [HANDLE.next]: node.next } : node.next;
  return Object.entries(targets).map(([handle, target]) => ({
    id: `${node.id}--${handle}`,
    source: node.id,
    sourceHandle: handle,
    target,
  }));
}

/** A seed workflow as the stored definition: nodes, edges and a layout. */
export function toWorkflowDef(seed: SeedWorkflow, order: number): WorkflowDef {
  const nodes = seed.nodes.map(
    (node) =>
      ({ id: node.id, type: node.type, data: node.data, position: { x: 0, y: 0 } }) as WaNode,
  );
  const graph: WaGraph = {
    start: seed.start ?? seed.nodes[0].id,
    nodes,
    edges: seed.nodes.flatMap(edgesOf),
  };
  return {
    key: seed.key,
    name: seed.name,
    description: seed.description,
    keywords: [...seed.keywords],
    order,
    graph: autoLayout(graph),
  };
}

/** A seed demo's profile as stored. */
export function toDemoProfile(seed: SeedDemo, order: number): DemoProfile {
  const { key, industry, business, greeting, menuText, menuButton } = seed;
  return { key, industry, business, greeting, menuText, menuButton, order, active: true };
}
