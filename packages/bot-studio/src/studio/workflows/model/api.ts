/**
 * What the workflow screens share about the server: row types from the generated documents
 * and the queries to refresh after a change, so the list, the editor and the chat's catalog
 * never show different versions of the same workflow.
 */
import type { WhatsappDemosQuery, WhatsappWorkflowsQuery } from '@exyconn/shell/graphql/generated';
import { channelOf, type DemoProfile, type WaGraph, type WorkflowDef } from '@exyconn/wa-flow';

export type DemoRow = WhatsappDemosQuery['whatsappDemos'][number];
export type WorkflowRow = WhatsappWorkflowsQuery['whatsappWorkflows'][number];

/** The list keeps the chosen demo in the URL, so a reload or the editor's Back returns to it. */
export const DEMO_PARAM = 'demo';

/** Refetched (when on screen) after a workflow is saved, published, discarded or copied. */
export const WORKFLOW_QUERIES = ['WhatsappWorkflows', 'WhatsappWorkflow', 'WhatsappDemoCatalog'];

/** Refetched after a demo profile changes. */
export const DEMO_QUERIES = ['WhatsappDemos', 'WhatsappDemoCatalog'];

/** The editor's link to one workflow. */
export function editorPath(workflowsPath: string, workflowId: string): string {
  return `${workflowsPath}/${workflowId}`;
}

/** The workflow list (`workflowsPath`, from the studio's config), opened on one demo. */
export function listPath(workflowsPath: string, demoId?: string): string {
  return demoId ? `${workflowsPath}?${DEMO_PARAM}=${encodeURIComponent(demoId)}` : workflowsPath;
}

/** A stored graph (`JSON` scalar); the server parsed it with `graphSchema` before storing. */
export function asGraph(json: unknown): WaGraph {
  return json as WaGraph;
}

/** The demo's stored profile, as the chat engine reads it. */
export function toDemoProfile(demo: DemoRow): DemoProfile {
  return {
    key: demo.key,
    channel: channelOf(demo.channel),
    industry: demo.industry,
    business: demo.business as DemoProfile['business'],
    greeting: demo.greeting,
    menuText: demo.menuText,
    menuButton: demo.menuButton,
    order: demo.order,
    active: demo.active,
  };
}

/** A workflow as the chat runs it, with whichever graph the caller wants it to run. */
export function toWorkflowDef(row: WorkflowRow, graph: WaGraph): WorkflowDef {
  return {
    key: row.key,
    name: row.name,
    description: row.description,
    keywords: [...row.keywords],
    order: row.order,
    graph,
  };
}
