/**
 * `@exyconn/bot-studio/studio` — the bot studio's screens, for one channel at a time: the
 * React Flow workflow editor (list + editor), analytics and session logs. The host app wraps
 * them in a `StudioProvider` naming the channel, its routes, its preview and refusal screen.
 */
export { StudioProvider, useStudio, type StudioConfig } from './StudioContext';
export { WorkflowEditorPage, WorkflowListPage } from './workflows';
export { AnalyticsTab } from './analytics';
export { SessionsTab } from './sessions';
export { FlowWorkspace, type FlowTools } from './workflows/editor/FlowWorkspace';
/** Wraps a `FlowWorkspace`: its canvas commands read React Flow's viewport. */
export { ReactFlowProvider as FlowProvider } from '@xyflow/react';
export { PreviewPane } from './workflows/editor/panels/PreviewPane';
export { useGraphEditor } from './workflows/editor/useGraphEditor';
export type { GraphEditor } from './workflows/editor/useWorkflowEditor';
export { useUnloadGuard } from './workflows/editor/useUnloadGuard';
export { QueryErrorState } from './shared/QueryErrorState';
export { isForbidden } from './shared/isForbidden';
