import { useCallback } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  SprintCompletionPlanDocument,
  useProjectSprintsQuery,
  useStartSprintMutation,
  useCompleteSprintMutation,
  useDeleteSprintMutation,
  type SprintCompletionPlanQuery,
  type SprintCompletionPlanQueryVariables,
  type SprintFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * A project's sprints, and the three lifecycle actions the list offers.
 *
 * Completing a sprint asks the server where its leftovers would go BEFORE the confirmation
 * is shown, so the dialog can name the destination. Guessing it in the UI would eventually
 * disagree with the server's own rule, and the person confirming would be told one thing
 * while another happened.
 */
export function useProjectSprints(projectId: string, onChanged: () => void) {
  const client = useApolloClient();
  const confirm = useConfirm();
  const notify = useNotify();
  const { data, loading, refetch } = useProjectSprintsQuery({
    variables: { projectId },
    skip: projectId === '',
    fetchPolicy: 'cache-and-network',
  });
  const [startSprint] = useStartSprintMutation();
  const [completeSprint] = useCompleteSprintMutation();
  const [deleteSprint] = useDeleteSprintMutation();

  const sprints = data?.projectSprints ?? [];

  const reload = useCallback(async () => {
    await refetch();
    onChanged();
  }, [refetch, onChanged]);

  const fail = useCallback(
    (error: unknown) => notify(errorMessage(error, 'Action failed'), 'error'),
    [notify],
  );

  const start = useCallback(
    async (sprint: SprintFieldsFragment) => {
      try {
        await startSprint({ variables: { id: sprint.id } });
        notify(`${sprint.name} is running`);
        await reload();
      } catch (error) {
        fail(error);
      }
    },
    [startSprint, notify, reload, fail],
  );

  const complete = useCallback(
    async (sprint: SprintFieldsFragment) => {
      try {
        const { data: planData } = await client.query<
          SprintCompletionPlanQuery,
          SprintCompletionPlanQueryVariables
        >({
          query: SprintCompletionPlanDocument,
          variables: { id: sprint.id },
          fetchPolicy: 'network-only',
        });
        const plan = planData.sprintCompletionPlan;
        const ticketWord = plan.unfinishedCount === 1 ? 'ticket' : 'tickets';
        const ok = await confirm({
          title: `Complete ${sprint.name}`,
          message:
            plan.unfinishedCount === 0
              ? `Everything in ${sprint.name} is done. Complete it?`
              : `${plan.unfinishedCount} unfinished ${ticketWord} will move to ${plan.targetSprintName}. Complete ${sprint.name}?`,
          confirmText: 'Complete',
        });
        if (!ok) {
          return;
        }
        await completeSprint({ variables: { id: sprint.id } });
        notify(`${sprint.name} is complete`);
        await reload();
      } catch (error) {
        fail(error);
      }
    },
    [client, confirm, completeSprint, notify, reload, fail],
  );

  const remove = useCallback(
    async (sprint: SprintFieldsFragment) => {
      const ok = await confirm({
        message: `Delete ${sprint.name}? Its tickets go back to the backlog.`,
        confirmText: 'Delete',
      });
      if (!ok) {
        return;
      }
      try {
        await deleteSprint({ variables: { id: sprint.id } });
        notify('Sprint deleted');
        await reload();
      } catch (error) {
        fail(error);
      }
    },
    [confirm, deleteSprint, notify, reload, fail],
  );

  return { sprints, loading, reload, start, complete, remove };
}
