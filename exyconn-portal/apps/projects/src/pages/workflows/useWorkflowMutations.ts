import { useCallback } from 'react';
import {
  ProjectWorkflowsDocument,
  useCreateProjectWorkflowMutation,
  useDeleteProjectWorkflowMutation,
  useUpdateProjectWorkflowMutation,
  type ProjectWorkflowInput,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/** The list re-reads after anything that changes it, so it never shows a stale row. */
const REFETCH = [{ query: ProjectWorkflowsDocument }];

/**
 * Creating, renaming and deleting workflows, with the portal's own success and error
 * notices. Each returns what the caller needs to carry on, or null/false when it failed.
 */
export function useWorkflowMutations() {
  const notify = useNotify();
  const [createWorkflow] = useCreateProjectWorkflowMutation({ refetchQueries: REFETCH });
  const [updateWorkflow] = useUpdateProjectWorkflowMutation({ refetchQueries: REFETCH });
  const [deleteWorkflow] = useDeleteProjectWorkflowMutation({ refetchQueries: REFETCH });

  const create = useCallback(
    async (input: ProjectWorkflowInput): Promise<string | null> => {
      try {
        const { data } = await createWorkflow({ variables: { input } });
        notify('Workflow created');
        return data?.createProjectWorkflow.id ?? null;
      } catch (error) {
        notify(errorMessage(error, 'Could not create the workflow'), 'error');
        return null;
      }
    },
    [createWorkflow, notify],
  );

  const update = useCallback(
    async (id: string, input: ProjectWorkflowInput): Promise<boolean> => {
      try {
        await updateWorkflow({ variables: { id, input } });
        notify('Workflow details saved');
        return true;
      } catch (error) {
        notify(errorMessage(error, 'Could not save the details'), 'error');
        return false;
      }
    },
    [updateWorkflow, notify],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteWorkflow({ variables: { id } });
        notify('Workflow deleted');
        return true;
      } catch (error) {
        notify(errorMessage(error, 'Could not delete the workflow'), 'error');
        return false;
      }
    },
    [deleteWorkflow, notify],
  );

  return { create, update, remove };
}
