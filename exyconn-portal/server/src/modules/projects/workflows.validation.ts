import { z } from 'zod';
import { WORKFLOW_NODE_KINDS } from './workflows.model';

/** A workflow anyone can still read on one screen. Past this it is several workflows. */
export const MAX_WORKFLOW_NODES = 200;
export const MAX_WORKFLOW_EDGES = 400;
const MAX_LABEL = 80;
const MAX_KEY = 64;
/** Canvas coordinates. Generous, but bounded so a stored graph cannot hold absurd numbers. */
const MAX_COORDINATE = 1_000_000;

const coordinate = z.number().finite().min(-MAX_COORDINATE).max(MAX_COORDINATE);

export const workflowGraphSchema = z.object({
  nodes: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(MAX_KEY),
        kind: z.enum(WORKFLOW_NODE_KINDS),
        label: z
          .string()
          .trim()
          .min(1, 'Every step needs a name')
          .max(MAX_LABEL, `Step names can be at most ${MAX_LABEL} characters`),
        x: coordinate,
        y: coordinate,
      }),
    )
    .max(MAX_WORKFLOW_NODES, `A workflow can have at most ${MAX_WORKFLOW_NODES} steps`),
  edges: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(MAX_KEY),
        source: z.string().trim().min(1),
        target: z.string().trim().min(1),
        label: z
          .string()
          .trim()
          .max(MAX_LABEL, `Connection labels can be at most ${MAX_LABEL} characters`),
      }),
    )
    .max(MAX_WORKFLOW_EDGES, `A workflow can have at most ${MAX_WORKFLOW_EDGES} connections`),
});

export type WorkflowGraph = z.infer<typeof workflowGraphSchema>;

/** Whether a list of keys has a repeat. */
const hasDuplicates = (keys: string[]) => new Set(keys).size !== keys.length;

/**
 * The rules a drawn workflow has to keep to be read as a workflow: one way in, at least one
 * way out, arrows only between boxes that exist, and no box pointing at itself. Returns the
 * first rule broken, in the words the editor shows, or null for a sound graph.
 */
export function workflowGraphProblem(graph: WorkflowGraph): string | null {
  const kindOf = new Map(graph.nodes.map((node) => [node.key, node.kind]));
  if (hasDuplicates(graph.nodes.map((node) => node.key))) {
    return 'Two steps share the same id';
  }
  if (hasDuplicates(graph.edges.map((edge) => edge.key))) {
    return 'Two connections share the same id';
  }
  if (graph.nodes.filter((node) => node.kind === 'START').length !== 1) {
    return 'A workflow needs exactly one Start';
  }
  if (!graph.nodes.some((node) => node.kind === 'END')) {
    return 'A workflow needs at least one End';
  }
  if (hasDuplicates(graph.edges.map((edge) => `${edge.source}>${edge.target}`))) {
    return 'Two connections join the same steps';
  }
  for (const edge of graph.edges) {
    const problem = edgeProblem(kindOf.get(edge.source), kindOf.get(edge.target), edge);
    if (problem) {
      return problem;
    }
  }
  return null;
}

/** What is wrong with one connection, given the kinds of the boxes at either end. */
function edgeProblem(
  sourceKind: string | undefined,
  targetKind: string | undefined,
  edge: WorkflowGraph['edges'][number],
): string | null {
  if (!sourceKind || !targetKind) {
    return 'A connection points at a step that is not there';
  }
  if (edge.source === edge.target) {
    return 'A step cannot connect to itself';
  }
  if (targetKind === 'START') {
    return 'Nothing can lead back into Start';
  }
  if (sourceKind === 'END') {
    return 'Nothing can follow an End';
  }
  return null;
}
