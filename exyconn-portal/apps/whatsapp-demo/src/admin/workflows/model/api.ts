/**
 * What the workflow screens share about the server: row types from the generated documents
 * and the queries to refresh after a change, so the list, the editor and the chat's catalog
 * never show different versions of the same workflow.
 */
import type { WhatsappDemosQuery, WhatsappWorkflowsQuery } from '@exyconn/shell/graphql/generated';
import type { DemoProfile, WaGraph, WorkflowDef } from '@exyconn/wa-flow';

export type DemoRow = WhatsappDemosQuery['whatsappDemos'][number];
export type WorkflowRow = WhatsappWorkflowsQuery['whatsappWorkflows'][number];

/** Where the workflow list lives; the editor is `${WORKFLOWS_PATH}/<id>`. */
export const WORKFLOWS_PATH = '/admin/bot-workflows';

/** The list keeps the chosen demo in the URL, so a reload or the editor's Back returns to it. */
export const DEMO_PARAM = 'demo';

/** Refetched (when on screen) after a workflow is saved, published, discarded or copied. */
export const WORKFLOW_QUERIES = ['WhatsappWorkflows', 'WhatsappWorkflow', 'WhatsappDemoCatalog'];

/** Refetched after a demo profile changes. */
export const DEMO_QUERIES = ['WhatsappDemos', 'WhatsappDemoCatalog'];

/** The editor's link to one workflow. */
export function editorPath(workflowId: string): string {
  return `${WORKFLOWS_PATH}/${workflowId}`;
}

export function listPath(demoId?: string): string {
  return demoId ? `${WORKFLOWS_PATH}?${DEMO_PARAM}=${encodeURIComponent(demoId)}` : WORKFLOWS_PATH;
}

/** A stored graph (`JSON` scalar); the server parsed it with `graphSchema` before storing. */
export function asGraph(json: unknown): WaGraph {
  return json as WaGraph;
}

/** The demo's stored profile, as the chat engine reads it. */
export function toDemoProfile(demo: DemoRow): DemoProfile {
  return {
    key: demo.key,
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
