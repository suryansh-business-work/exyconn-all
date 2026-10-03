/**
 * A left-to-right layered layout: each node one column right of the first node that leads to
 * it. Good enough for seeded graphs and the editor's "Tidy up" — authors then drag freely.
 */
import type { WaGraph } from './schema';

/** Column and row pitch, in canvas units (React Flow pixels at zoom 1). */
export const LAYOUT_GAP = { x: 340, y: 200 } as const;

function depths(graph: WaGraph): Map<string, number> {
  const depth = new Map<string, number>([[graph.start, 0]]);
  const queue = [graph.start];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const level = depth.get(current) ?? 0;
    for (const edge of graph.edges.filter((e) => e.source === current)) {
      if (!depth.has(edge.target)) {
        depth.set(edge.target, level + 1);
        queue.push(edge.target);
      }
    }
  }
  return depth;
}

/** The same graph with every node given a tidy position. */
export function autoLayout(graph: WaGraph): WaGraph {
  const depth = depths(graph);
  const last = Math.max(0, ...depth.values()) + 1;
  const rows = new Map<number, number>();
  const nodes = graph.nodes.map((node) => {
    const column = depth.get(node.id) ?? last;
    const row = rows.get(column) ?? 0;
    rows.set(column, row + 1);
    return { ...node, position: { x: column * LAYOUT_GAP.x, y: row * LAYOUT_GAP.y } };
  });
  return { ...graph, nodes };
}
