/**
 * The working copy of one stored graph that is not a chat workflow — a calling bot's call
 * flow. The stored graph is adopted when it first loads and whenever a newer copy arrives
 * while nothing is unsaved; while there are unsaved edits it is never overwritten.
 */
import { useCallback, useState } from 'react';
import type { WaGraph } from '@exyconn/wa-flow';
import type { GraphEditor } from './useWorkflowEditor';

interface StoredGraph {
  /** Changes whenever the stored copy does (id plus its last update). */
  revision: string;
  graph: WaGraph;
}

export function useGraphEditor(stored: StoredGraph | null): GraphEditor & {
  /** Takes a freshly saved copy as the new baseline. */
  adopt: (next: StoredGraph) => void;
} {
  const [graph, setGraph] = useState<WaGraph>({ start: '', nodes: [], edges: [] });
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState<string | null>(null);

  const adopt = useCallback((next: StoredGraph) => {
    setRevision(next.revision);
    setGraph(next.graph);
    setDirty(false);
  }, []);

  // First load, or a newer stored copy while nothing is unsaved (adjusting state in render).
  if (stored && !dirty && stored.revision !== revision) {
    adopt(stored);
  }

  const update = useCallback((edit: (current: WaGraph) => WaGraph) => {
    setGraph(edit);
    setDirty(true);
  }, []);

  return { graph, dirty, selectedId, select: setSelectedId, update, adopt };
}
