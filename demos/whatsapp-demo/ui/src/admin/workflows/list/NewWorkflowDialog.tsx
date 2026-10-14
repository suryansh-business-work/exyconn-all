import { useNavigate } from 'react-router-dom';
import { useCreateWhatsappWorkflowMutation } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { WORKFLOW_QUERIES, editorPath } from '../model/api';
import { WorkflowDetailsDialog } from '../WorkflowDetailsDialog';
import type { WorkflowDetailsValues } from '../forms/workflow-details';

interface NewWorkflowDialogProps {
  open: boolean;
  demoId: string;
  /** New workflows go to the end of the menu. */
  nextOrder: number;
  onClose: () => void;
}

/** Creates a workflow in the selected demo and opens it in the editor. */
export function NewWorkflowDialog({
  open,
  demoId,
  nextOrder,
  onClose,
}: Readonly<NewWorkflowDialogProps>) {
  const navigate = useNavigate();
  const notify = useNotify();
  const [create] = useCreateWhatsappWorkflowMutation({ refetchQueries: WORKFLOW_QUERIES });
  const initial: WorkflowDetailsValues = {
    key: '',
    name: '',
    description: '',
    keywords: [],
    order: nextOrder,
  };

  const onSubmit = async (values: WorkflowDetailsValues) => {
    try {
      const result = await create({ variables: { input: { demoId, ...values } } });
      const created = result.data?.createWhatsappWorkflow;
      if (created) {
        notify('Workflow "{name}" created', 'success', { name: created.name });
        navigate(editorPath(created.id));
      }
    } catch (error) {
      console.error('Could not create the workflow', error);
      notify(errorMessage(error, 'Could not create the workflow'), 'error');
    }
  };

  return (
    <WorkflowDetailsDialog
      open={open}
      title="New workflow"
      initial={initial}
      isEdit={false}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}
