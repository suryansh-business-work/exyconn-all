import { useCallback, useMemo } from 'react';
import {
  TaskVisibility,
  useGetProjectQuery,
  useListProjectMembersQuery,
  useMoveTaskMutation,
  useProjectColumnsQuery,
  useProjectTasksQuery,
  useSetTaskVisibilityMutation,
  useTaskByKeyQuery,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';

/**
 * Everything the ticket page reads and the two writes it owns beyond the form: moving the
 * ticket to another column and switching it between private and public. The project's
 * tickets are read too — they are where the Epic picker and the child list come from.
 */
export function useTicketPage(key: string) {
  const notify = useNotify();
  const byKey = useTaskByKeyQuery({
    variables: { key },
    skip: key === '',
    fetchPolicy: 'cache-and-network',
  });
  const ticket = byKey.data?.taskByKey ?? null;
  const projectId = ticket?.projectId ?? '';
  const skip = projectId === '';

  const project = useGetProjectQuery({ variables: { id: projectId }, skip });
  const columns = useProjectColumnsQuery({
    variables: { projectId },
    skip,
    fetchPolicy: 'cache-and-network',
  });
  const tasks = useProjectTasksQuery({
    variables: { projectId },
    skip,
    fetchPolicy: 'cache-and-network',
  });
  const members = useListProjectMembersQuery();
  const [moveTask] = useMoveTaskMutation();
  const [setVisibility, { loading: switching }] = useSetTaskVisibilityMutation();

  const { refetch: refetchTicket } = byKey;
  const { refetch: refetchTasks } = tasks;
  const reload = useCallback(() => {
    Promise.all([refetchTicket(), refetchTasks()]).catch((error: unknown) =>
      notify(errorMessage(error, 'Could not reload the ticket'), 'error'),
    );
  }, [refetchTicket, refetchTasks, notify]);

  const tickets = useMemo(() => tasks.data?.projectTasks ?? [], [tasks.data]);
  const people = useMemo(
    () =>
      (members.data?.listProjectMembers ?? []).map((member) => ({
        value: member.id,
        label: member.name,
      })),
    [members.data],
  );

  /** Puts the ticket at the bottom of the column chosen, the way the board's picker does. */
  const move = async (toColumnId: string) => {
    if (!ticket) {
      return;
    }
    const toIndex = tickets.filter((t) => t.columnId === toColumnId && t.id !== ticket.id).length;
    try {
      await moveTask({ variables: { id: ticket.id, toColumnId, toIndex } });
      notify('Ticket moved');
      reload();
    } catch (error) {
      notify(errorMessage(error, 'Could not move the ticket'), 'error');
    }
  };

  const changeVisibility = async (visibility: TaskVisibility) => {
    if (!ticket) {
      return;
    }
    try {
      await setVisibility({ variables: { id: ticket.id, visibility } });
      notify(
        visibility === TaskVisibility.Public
          ? 'Anyone with the public link can now read this ticket'
          : 'Only people signed in to Projects can read this ticket now',
      );
    } catch (error) {
      notify(errorMessage(error, 'Could not change who can see the ticket'), 'error');
    }
  };

  return {
    loading: byKey.loading && !ticket,
    error: byKey.error,
    ticket,
    project: project.data?.getProject ?? null,
    columns: columns.data?.projectColumns ?? [],
    tickets,
    people,
    switching,
    move,
    changeVisibility,
    reload,
  };
}

export type TicketPageState = ReturnType<typeof useTicketPage>;
