import { useCallback, useMemo, useState } from 'react';
import { useCrudResource } from '@exyconn/crud';
import {
  MaActionStatus,
  useMaActionStatsQuery,
  useMaDeleteActionItemMutation,
  useMaSetActionStatusMutation,
} from '@exyconn/shell/graphql/generated';
import type { ActionItemRow } from '../forms/action-item';
import { toMaScope, type MeetingScope } from '../lib/scope';
import { useRunNotified } from '../lib/useRunNotified';
import type { ActionSelection } from './selection';

/**
 * The checklist's state and actions: stats, create/edit/delete, completing and reopening,
 * the ticked rows and the item open in the drawer.
 */
export function useActionChecklist(scope: MeetingScope, meetingId?: string) {
  const variables = { scope: toMaScope(scope), meetingId };
  const stats = useMaActionStatsQuery({ variables, fetchPolicy: 'cache-and-network' });
  const [deleteItem] = useMaDeleteActionItemMutation();
  const [setStatus] = useMaSetActionStatusMutation();
  const runNotified = useRunNotified();
  const crud = useCrudResource<ActionItemRow>({
    label: 'Action item',
    onDelete: (row) => deleteItem({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete action item "{title}"?',
      values: { title: row.title },
    }),
    refetch: () => stats.refetch(),
    scope: 'action',
  });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [viewing, setViewing] = useState<ActionItemRow | null>(null);

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const selection = useMemo<ActionSelection>(() => ({ selected, toggle }), [selected, toggle]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const toggleDone = async (row: ActionItemRow) => {
    const done = row.status === MaActionStatus.Completed;
    const status = done ? MaActionStatus.Pending : MaActionStatus.Completed;
    const saved = await runNotified(
      () => setStatus({ variables: { id: row.id, status } }),
      done ? 'Action item reopened' : 'Action item completed',
    );
    if (saved) {
      crud.reload();
    }
  };

  const afterBulk = () => {
    clearSelection();
    crud.reload();
  };

  return {
    stats: stats.data?.maActionStats,
    statsLoading: !stats.data && stats.loading,
    crud,
    selection,
    clearSelection,
    afterBulk,
    toggleDone,
    viewing,
    setViewing,
  };
}
