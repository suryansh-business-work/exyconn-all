import { useCallback } from 'react';
import {
  useDeleteTaskMutation,
  useUpdateTaskMutation,
  type TaskInput,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';

/** Save and delete for one ticket, with the portal's own error reporting. */
export function useTicket(onChanged: () => void) {
  const notify = useNotify();
  const [updateTask, { loading: saving }] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const fail = useCallback(
    (e: unknown) => notify(e instanceof Error ? e.message : 'Action failed', 'error'),
    [notify],
  );

  const save = useCallback(
    async (id: string, input: TaskInput) => {
      try {
        await updateTask({ variables: { id, input } });
        notify('Ticket saved');
        onChanged();
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    },
    [updateTask, notify, onChanged, fail],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteTask({ variables: { id } });
        notify('Ticket deleted');
        onChanged();
        return true;
      } catch (error) {
        fail(error);
        return false;
      }
    },
    [deleteTask, notify, onChanged, fail],
  );

  return { save, remove, saving };
}
