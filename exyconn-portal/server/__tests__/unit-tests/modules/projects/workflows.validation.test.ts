import {
  MAX_WORKFLOW_EDGES,
  MAX_WORKFLOW_NODES,
  workflowGraphProblem,
  workflowGraphSchema,
  type WorkflowGraph,
} from '../../../../src/modules/projects/workflows.validation';

type Node = WorkflowGraph['nodes'][number];
type Edge = WorkflowGraph['edges'][number];

const node = (key: string, kind: Node['kind'], label = key): Node => ({
  key,
  kind,
  label,
  x: 0,
  y: 0,
});
const edge = (source: string, target: string, key = `${source}-${target}`): Edge => ({
  key,
  source,
  target,
  label: '',
});

/** Start → Review → (Yes) End, the smallest graph with a step in the middle. */
const sound = (): WorkflowGraph => ({
  nodes: [node('start', 'START'), node('review', 'DECISION'), node('end', 'END')],
  edges: [edge('start', 'review'), edge('review', 'end')],
});

const firstMessage = (graph: unknown) => {
  const parsed = workflowGraphSchema.safeParse(graph);
  return parsed.success ? null : parsed.error.issues[0]?.message;
};

describe('workflowGraphSchema', () => {
  it('reads a sound graph and trims its text', () => {
    const graph = sound();
    graph.nodes[1].label = '  Review  ';

    const parsed = workflowGraphSchema.parse(graph);

    expect(parsed.nodes[1].label).toBe('Review');
  });

  it('asks every step for a name', () => {
    const graph = sound();
    graph.nodes[1].label = '   ';

    expect(firstMessage(graph)).toBe('Every step needs a name');
  });

  it('bounds step names and connection labels to 80 characters', () => {
    const named = sound();
    named.nodes[1].label = 'x'.repeat(81);
    const labelled = sound();
    labelled.edges[0].label = 'x'.repeat(81);

    expect(firstMessage(named)).toBe('Step names can be at most 80 characters');
    expect(firstMessage(labelled)).toBe('Connection labels can be at most 80 characters');
  });

  it('caps the number of steps and connections', () => {
    const tooManySteps = {
      nodes: Array.from({ length: MAX_WORKFLOW_NODES + 1 }, (_v, i) => node(`n${i}`, 'STEP')),
      edges: [],
    };
    const tooManyEdges = {
      nodes: [],
      edges: Array.from({ length: MAX_WORKFLOW_EDGES + 1 }, (_v, i) => edge('a', 'b', `e${i}`)),
    };

    expect(firstMessage(tooManySteps)).toBe('A workflow can have at most 200 steps');
    expect(firstMessage(tooManyEdges)).toBe('A workflow can have at most 400 connections');
  });

  it.each([Infinity, Number.NaN, 1_000_001, -1_000_001])(
    'refuses the canvas coordinate %s',
    (x) => {
      const graph = sound();
      graph.nodes[0].x = x;

      expect(workflowGraphSchema.safeParse(graph).success).toBe(false);
    },
  );

  it('takes coordinates at the edge of the canvas', () => {
    const graph = sound();
    graph.nodes[0].x = 1_000_000;
    graph.nodes[0].y = -1_000_000;

    expect(workflowGraphSchema.safeParse(graph).success).toBe(true);
  });

  it('refuses a step kind it does not know', () => {
    expect(
      workflowGraphSchema.safeParse({ nodes: [{ ...node('a', 'STEP'), kind: 'LOOP' }], edges: [] })
        .success,
    ).toBe(false);
  });
});

describe('workflowGraphProblem', () => {
  it('passes a sound graph', () => {
    expect(workflowGraphProblem(sound())).toBeNull();
  });

  it.each<[string, (graph: WorkflowGraph) => void, string]>([
    [
      'two steps with one id',
      (g) => g.nodes.push(node('review', 'STEP')),
      'Two steps share the same id',
    ],
    [
      'two connections with one id',
      (g) => g.edges.push(edge('start', 'end', 'start-review')),
      'Two connections share the same id',
    ],
    [
      'no Start',
      (g) => {
        g.nodes[0].kind = 'STEP';
      },
      'A workflow needs exactly one Start',
    ],
    [
      'two Starts',
      (g) => g.nodes.push(node('start2', 'START')),
      'A workflow needs exactly one Start',
    ],
    [
      'no End',
      (g) => {
        g.nodes[2].kind = 'STEP';
      },
      'A workflow needs at least one End',
    ],
    [
      'two connections between the same steps',
      (g) => g.edges.push(edge('start', 'review', 'again')),
      'Two connections join the same steps',
    ],
    [
      'a connection from a missing step',
      (g) => g.edges.push(edge('ghost', 'end')),
      'A connection points at a step that is not there',
    ],
    [
      'a connection to a missing step',
      (g) => g.edges.push(edge('review', 'ghost')),
      'A connection points at a step that is not there',
    ],
    [
      'a step joined to itself',
      (g) => g.edges.push(edge('review', 'review')),
      'A step cannot connect to itself',
    ],
    [
      'a connection back into Start',
      (g) => g.edges.push(edge('review', 'start')),
      'Nothing can lead back into Start',
    ],
    [
      'a connection out of an End',
      (g) => g.edges.push(edge('end', 'review')),
      'Nothing can follow an End',
    ],
  ])('refuses %s', (_label, breakIt, message) => {
    const graph = sound();
    breakIt(graph);

    expect(workflowGraphProblem(graph)).toBe(message);
  });
});
