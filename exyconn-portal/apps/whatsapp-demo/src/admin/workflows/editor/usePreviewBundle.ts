/**
 * What "Preview in WhatsApp" runs: the demo's profile, this workflow with its DRAFT graph,
 * and the demo's other workflows as published (so a Jump lands where it would in the chat).
 */
import { useMemo } from 'react';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import type { WaGraph, WorkflowDef } from '@exyconn/wa-flow';
import {
  asGraph,
  toDemoProfile,
  toWorkflowDef,
  type DemoRow,
  type WorkflowRow,
} from '../model/api';
import type { WorkflowMeta } from './useWorkflowEditor';

export function usePreviewBundle(
  demo: DemoRow | undefined,
  workflow: WorkflowRow,
  siblings: readonly WorkflowRow[],
  graph: WaGraph,
  meta: WorkflowMeta | null,
): DemoBundle | null {
  return useMemo(() => {
    if (!demo) {
      return null;
    }
    const others: WorkflowDef[] = siblings
      .filter((row) => row.id !== workflow.id && row.published)
      .map((row) => toWorkflowDef(row, asGraph(row.published)));
    const own = { ...toWorkflowDef(workflow, graph), ...meta };
    const workflows = [...others, own].sort((a, b) => a.order - b.order);
    return { demo: toDemoProfile(demo), workflows };
  }, [demo, graph, meta, siblings, workflow]);
}
