/**
 * The editor's working copy of one workflow: the draft graph, its details, what is selected
 * and whether anything is unsaved. The server's copy is adopted when it first loads and after
 * every save, publish or discard; while there are unsaved edits it is never overwritten.
 */
import { useCallback, useState } from 'react';
import type { WaGraph } from '@exyconn/wa-flow';
import { asGraph, type WorkflowRow } from '../model/api';

export interface WorkflowMeta {
  name: string;
  description: string;
  keywords: string[];
  order: number;
}

const EMPTY_GRAPH: WaGraph = { start: '', nodes: [], edges: [] };

/** A server row's details, as the editor holds them. */
export const metaOf = (row: WorkflowRow): WorkflowMeta => ({
  name: row.name,
  description: row.description,
  keywords: [...row.keywords],
  order: row.order,
});

const revisionOf = (row: WorkflowRow) => `${row.id}:${row.updatedAt}`;

export function useWorkflowEditor(workflow: WorkflowRow | null | undefined) {
  const [graph, setGraph] = useState<WaGraph>(EMPTY_GRAPH);
  const [meta, setMetaState] = useState<WorkflowMeta | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState<string | null>(null);

  const adopt = useCallback((row: WorkflowRow) => {
    setRevision(revisionOf(row));
    setGraph(asGraph(row.draft));
    setMetaState(metaOf(row));
    setDirty(false);
  }, []);

  // First load, or a newer server copy while nothing is unsaved (adjusting state in render).
  if (workflow && !dirty && revisionOf(workflow) !== revision) {
    adopt(workflow);
  }

  const update = useCallback((edit: (current: WaGraph) => WaGraph) => {
    setGraph(edit);
    setDirty(true);
  }, []);

  const setMeta = useCallback((next: WorkflowMeta) => {
    setMetaState(next);
    setDirty(true);
  }, []);

  return {
    graph,
    meta,
    dirty,
    selectedId,
    select: setSelectedId,
    update,
    setMeta,
    adopt,
  };
}

export type WorkflowEditor = ReturnType<typeof useWorkflowEditor>;
