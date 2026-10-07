import { describe, expect, it } from 'vitest';
import type { NodeOf, WaGraph, WaNode } from '@exyconn/wa-flow';
import {
  addNode,
  connect,
  moveNode,
  newNodeId,
  removeEdges,
  removeNodes,
  setStart,
  updateNodeData,
} from '../../../../../src/admin/workflows/model/graph-ops';
import { defaultNodeData } from '../../../../../src/admin/workflows/model/node-defaults';

const at = { x: 0, y: 0 };

const textNode = (id: string): WaNode => ({ id, type: 'text', position: at, data: { text: id } });

const buttonsNode = (id: string, ids: string[]): NodeOf<'buttons'> => ({
  id,
  type: 'buttons',
  position: at,
  data: { text: 'Pick', buttons: ids.map((b) => ({ id: b, title: b.toUpperCase() })) },
});

/** start(buttons yes/no) → a, b; a → b. */
function sampleGraph(): WaGraph {
  return {
    start: 'start',
    nodes: [buttonsNode('start', ['yes', 'no']), textNode('a'), textNode('b')],
    edges: [
      { id: 'start--yes', source: 'start', sourceHandle: 'yes', target: 'a' },
      { id: 'start--no', source: 'start', sourceHandle: 'no', target: 'b' },
      { id: 'a--next', source: 'a', sourceHandle: 'next', target: 'b' },
    ],
  };
}

describe('newNodeId', () => {
  it('numbers from the node count, starting at 1 on an empty graph', () => {
    expect(newNodeId({ start: '', nodes: [], edges: [] }, 'text')).toBe('text-1');
    expect(newNodeId(sampleGraph(), 'delay')).toBe('delay-4');
  });

  it('skips ids that are already taken', () => {
    const graph: WaGraph = { start: 'text-2', nodes: [textNode('text-2')], edges: [] };
    expect(newNodeId(graph, 'text')).toBe('text-3');
  });
});

describe('addNode', () => {
  it('makes the first node of an empty graph its start, with valid default data', () => {
    const { graph, id } = addNode({ start: '', nodes: [], edges: [] }, 'jump', at, ['main-menu']);
    expect(id).toBe('jump-1');
    expect(graph.start).toBe('jump-1');
    expect(graph.nodes).toEqual([
      { id: 'jump-1', type: 'jump', position: at, data: { workflowKey: 'main-menu' } },
    ]);
  });

  it('keeps the existing start and appends the new node at its position', () => {
    const before = sampleGraph();
    const { graph, id } = addNode(before, 'notice', { x: 40, y: 80 }, []);
    expect(graph.start).toBe('start');
    expect(graph.nodes).toHaveLength(4);
    expect(graph.nodes.at(-1)).toEqual({
      id,
      type: 'notice',
      position: { x: 40, y: 80 },
      data: defaultNodeData('notice', []),
    });
    expect(before.nodes).toHaveLength(3);
  });
});

describe('removeNodes', () => {
  it('drops the nodes and every edge touching them', () => {
    const graph = removeNodes(sampleGraph(), ['a']);
    expect(graph.nodes.map((n) => n.id)).toEqual(['start', 'b']);
    expect(graph.edges.map((e) => e.id)).toEqual(['start--no']);
    expect(graph.start).toBe('start');
  });

  it('passes a removed start to the first node left', () => {
    const graph = removeNodes(sampleGraph(), ['start']);
    expect(graph.start).toBe('a');
    expect(graph.edges.map((e) => e.id)).toEqual(['a--next']);
  });

  it('leaves an empty start when every node is removed', () => {
    const graph = removeNodes(sampleGraph(), ['start', 'a', 'b']);
    expect(graph).toEqual({ start: '', nodes: [], edges: [] });
  });
});

describe('removeEdges', () => {
  it('removes only the named edges', () => {
    const graph = removeEdges(sampleGraph(), ['start--yes', 'missing']);
    expect(graph.edges.map((e) => e.id)).toEqual(['start--no', 'a--next']);
    expect(graph.nodes).toHaveLength(3);
  });
});

describe('connect', () => {
  it('adds an edge named after its source output', () => {
    const graph = connect(sampleGraph(), { source: 'b', sourceHandle: 'next', target: 'a' });
    expect(graph.edges.at(-1)).toEqual({
      id: 'b--next',
      source: 'b',
      sourceHandle: 'next',
      target: 'a',
    });
  });

  it('replaces the edge an output already had, since an output leads to one node', () => {
    const graph = connect(sampleGraph(), { source: 'start', sourceHandle: 'yes', target: 'b' });
    const fromYes = graph.edges.filter((e) => e.sourceHandle === 'yes');
    expect(fromYes).toEqual([
      { id: 'start--yes', source: 'start', sourceHandle: 'yes', target: 'b' },
    ]);
    expect(graph.edges).toHaveLength(3);
  });

  it('replaces a stale edge that already carries the new id', () => {
    const base = sampleGraph();
    const stale: WaGraph = {
      ...base,
      edges: [{ id: 'a--next', source: 'x', sourceHandle: 'y', target: 'b' }],
    };
    const graph = connect(stale, { source: 'a', sourceHandle: 'next', target: 'start' });
    expect(graph.edges).toEqual([
      { id: 'a--next', source: 'a', sourceHandle: 'next', target: 'start' },
    ]);
  });
});

describe('updateNodeData', () => {
  it('returns the same graph for a node that does not exist', () => {
    const before = sampleGraph();
    expect(updateNodeData(before, 'ghost', { text: 'x' })).toBe(before);
  });

  it('replaces the data and drops edges from outputs that no longer exist', () => {
    const graph = updateNodeData(sampleGraph(), 'start', {
      text: 'Pick again',
      buttons: [{ id: 'yes', title: 'YES' }],
    });
    expect(graph.nodes[0].data).toEqual({
      text: 'Pick again',
      buttons: [{ id: 'yes', title: 'YES' }],
    });
    expect(graph.edges.map((e) => e.id)).toEqual(['start--yes', 'a--next']);
  });

  it('keeps edges leaving other nodes', () => {
    const graph = updateNodeData(sampleGraph(), 'a', { text: 'changed' });
    expect(graph.edges).toHaveLength(3);
    expect(graph.nodes[1].data).toEqual({ text: 'changed' });
  });
});

describe('moveNode and setStart', () => {
  it('moves only the named node', () => {
    const graph = moveNode(sampleGraph(), 'b', { x: 5, y: 9 });
    expect(graph.nodes[2].position).toEqual({ x: 5, y: 9 });
    expect(graph.nodes[1].position).toEqual(at);
  });

  it('sets the start node', () => {
    expect(setStart(sampleGraph(), 'b').start).toBe('b');
  });
});
