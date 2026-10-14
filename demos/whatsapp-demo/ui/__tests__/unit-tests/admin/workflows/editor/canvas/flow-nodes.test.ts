import type { GraphIssue, WaGraph } from '@exyconn/wa-flow';
import {
  countIssues,
  toFlowNodes,
  type FlowView,
  type WaFlowNode,
} from '../../../../../../src/admin/workflows/editor/canvas/flow-nodes';
import { makeNode } from '../inspector/node-form-helpers';

const GRAPH: WaGraph = {
  start: 'text-1',
  nodes: [makeNode('text'), makeNode('ai', {}, 'ai-1')],
  edges: [],
};

const VIEW: FlowView = { selectedId: null, issues: new Map(), aiConfigured: true };

describe('countIssues', () => {
  it('counts errors and warnings per node and skips graph-wide issues', () => {
    const issues: GraphIssue[] = [
      { severity: 'error', nodeId: 'a', message: 'x' },
      { severity: 'warning', nodeId: 'a', message: 'y' },
      { severity: 'error', nodeId: 'a', message: 'z' },
      { severity: 'warning', nodeId: 'b', message: 'w' },
      { severity: 'error', message: 'No start' },
    ];
    const counts = countIssues(issues);
    expect(counts.get('a')).toEqual({ errors: 2, warnings: 1 });
    expect(counts.get('b')).toEqual({ errors: 0, warnings: 1 });
    expect(counts.size).toBe(2);
  });
});

describe('toFlowNodes', () => {
  it('derives each node with its start flag, selection and issue counts', () => {
    const view: FlowView = {
      selectedId: 'ai-1',
      issues: new Map([['text-1', { errors: 1, warnings: 2 }]]),
      aiConfigured: true,
    };
    const [text, ai] = toFlowNodes(GRAPH, view, []);
    expect(text).toMatchObject({
      id: 'text-1',
      type: 'text',
      position: { x: 0, y: 0 },
      selected: false,
      data: { isStart: true, errors: 1, warnings: 2, aiMissing: false },
    });
    expect(ai).toMatchObject({
      selected: true,
      data: { isStart: false, errors: 0, warnings: 0, aiMissing: false },
    });
  });

  it('marks AI nodes while OpenAI is not configured', () => {
    const [text, ai] = toFlowNodes(GRAPH, { ...VIEW, aiConfigured: false }, []);
    expect(text.data.aiMissing).toBe(false);
    expect(ai.data.aiMissing).toBe(true);
  });

  it('keeps what React Flow measured and the position of a node being dragged', () => {
    const previous: WaFlowNode[] = [
      {
        ...toFlowNodes(GRAPH, VIEW, [])[0],
        position: { x: 50, y: 60 },
        measured: { width: 240, height: 90 },
        dragging: true,
      },
      { ...toFlowNodes(GRAPH, VIEW, [])[1], position: { x: 5, y: 5 }, dragging: false },
    ];
    const [dragged, idle] = toFlowNodes(GRAPH, VIEW, previous);
    expect(dragged.position).toEqual({ x: 50, y: 60 });
    expect(dragged.measured).toEqual({ width: 240, height: 90 });
    expect(dragged.dragging).toBe(true);
    expect(idle.position).toEqual({ x: 0, y: 0 });
  });
});
