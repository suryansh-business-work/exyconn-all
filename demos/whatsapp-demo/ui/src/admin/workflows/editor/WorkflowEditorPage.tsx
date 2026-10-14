import { useParams } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { useT } from '@exyconn/i18n';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import {
  useWhatsappDemoAiStatusQuery,
  useWhatsappDemosQuery,
  useWhatsappWorkflowQuery,
  useWhatsappWorkflowsQuery,
} from '@exyconn/shell/graphql/generated';
import { QueryErrorState } from '../../shared/QueryErrorState';
import { EditorWorkspace } from './EditorWorkspace';
import { useWorkflowEditor } from './useWorkflowEditor';

/**
 * `/admin/bot-workflows/:workflowId`: the React Flow editor for one workflow's draft, with
 * the demo's other workflows (for Jump and the preview) and whether OpenAI is set up.
 */
export function WorkflowEditorPage() {
  const t = useT();
  const { workflowId = '' } = useParams<{ workflowId: string }>();
  const workflowQuery = useWhatsappWorkflowQuery({
    variables: { id: workflowId },
    skip: !workflowId,
  });
  const workflow = workflowQuery.data?.whatsappWorkflow;
  const siblingsQuery = useWhatsappWorkflowsQuery({
    variables: { demoId: workflow?.demoId },
    skip: !workflow,
  });
  const demosQuery = useWhatsappDemosQuery();
  const aiQuery = useWhatsappDemoAiStatusQuery();
  const editor = useWorkflowEditor(workflow);
  usePageTitle(t('Edit {name}', { name: workflow?.name ?? '' }));

  if (workflowQuery.error) {
    return (
      <QueryErrorState
        error={workflowQuery.error}
        title="Could not load the workflow."
        onRetry={workflowQuery.refetch}
      />
    );
  }
  if (workflowQuery.loading && !workflow) {
    return <LoadingState />;
  }
  if (!workflow) {
    return (
      <EmptyState title="This workflow does not exist." description="It may have been deleted." />
    );
  }

  return (
    <ReactFlowProvider>
      <EditorWorkspace
        workflow={workflow}
        demo={demosQuery.data?.whatsappDemos.find((demo) => demo.id === workflow.demoId)}
        siblings={siblingsQuery.data?.whatsappWorkflows}
        aiConfigured={aiQuery.data?.whatsappDemoAiStatus.configured ?? true}
        editor={editor}
      />
    </ReactFlowProvider>
  );
}
