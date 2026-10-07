import { describe, expect, it } from 'vitest';
import { autoLayout, LAYOUT_GAP } from '../../src/layout';
import type { WaEdge, WaGraph, WaNode } from '../../src/schema';

const text = (id: string): WaNode => ({
  id,
  type: 'text',
  position: { x: 9, y: 9 },
  data: { text: id },
});
const edge = (source: string, target: string): WaEdge => ({
  id: `${source}-${target}`,
  source,
  sourceHandle: 'next',
  target,
});

function positions(graph: WaGraph): Record<string, { x: number; y: number }> {
  return Object.fromEntries(autoLayout(graph).nodes.map((n) => [n.id, n.position]));
}

describe('autoLayout', () => {
  it('puts each node one column right of the first node leading to it', () => {
    const p = positions({
      start: 'a',
      nodes: [text('a'), text('b'), text('c'), text('d')],
      edges: [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')],
    });
    expect(p).toEqual({
      a: { x: 0, y: 0 },
      b: { x: LAYOUT_GAP.x, y: 0 },
      c: { x: LAYOUT_GAP.x, y: LAYOUT_GAP.y },
      d: { x: 2 * LAYOUT_GAP.x, y: 0 },
    });
  });

  it('survives loops and keeps the first depth found', () => {
    const p = positions({
      start: 'a',
      nodes: [text('a'), text('b')],
      edges: [edge('a', 'b'), edge('b', 'a')],
    });
    expect(p).toEqual({ a: { x: 0, y: 0 }, b: { x: LAYOUT_GAP.x, y: 0 } });
  });

  it('parks unreachable nodes in a column after the deepest one', () => {
    const p = positions({
      start: 'a',
      nodes: [text('a'), text('lost'), text('also-lost')],
      edges: [],
    });
    expect(p.lost).toEqual({ x: LAYOUT_GAP.x, y: 0 });
    expect(p['also-lost']).toEqual({ x: LAYOUT_GAP.x, y: LAYOUT_GAP.y });
  });

  it('leaves the rest of the graph as it was', () => {
    const graph: WaGraph = { start: 'a', nodes: [text('a')], edges: [] };
    const laid = autoLayout(graph);
    expect(laid.start).toBe('a');
    expect(laid.edges).toBe(graph.edges);
    expect(graph.nodes[0].position).toEqual({ x: 9, y: 9 });
  });
});
