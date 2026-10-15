import { useCallback } from 'react';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateCrmViewMutation,
  useDeleteCrmViewMutation,
  useUpdateCrmViewMutation,
  type CrmObject,
  type CrmViewInput,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  queryOfView,
  toSnapshot,
  type CrmViewRow,
  type RecordQueryState,
} from '../list/recordQuery';
import type { RecordQuery } from '../list/useRecordQuery';

/** A view's name and whether the team sees it. */
export interface ViewDetails {
  name: string;
  shared: boolean;
}

function viewInput(object: CrmObject, query: RecordQueryState, details: ViewDetails): CrmViewInput {
  return { object, ...details, ...toSnapshot(query) };
}

/**
 * Saving, renaming, sharing and deleting a list's views. Only the viewer's own views can be
 * changed — the server refuses the rest too — and every failure is shown and logged.
 */
export function useViewActions(object: CrmObject, list: RecordQuery) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [createView, created] = useCreateCrmViewMutation();
  const [updateView, updated] = useUpdateCrmViewMutation();
  const [deleteView, deleted] = useDeleteCrmViewMutation();
  const { query, selectedView, refetchViews, selectView } = list;

  const fail = useCallback(
    (what: string, error: unknown) => {
      portalLogger.error(what, error, { object });
      notify(errorMessage(error, what), 'error');
    },
    [notify, object],
  );

  /** Saves the working query over the open view (which must be the viewer's). */
  const saveOver = useCallback(async () => {
    if (!selectedView?.mine) {
      return;
    }
    const details = { name: selectedView.name, shared: selectedView.shared };
    try {
      await updateView({
        variables: { id: selectedView.id, input: viewInput(object, query, details) },
      });
      notify('View "{name}" saved', 'success', { name: selectedView.name });
    } catch (error) {
      fail('Could not save the view', error);
    }
  }, [selectedView, updateView, object, query, notify, fail]);

  /** Saves the working query as a new view and opens it. */
  const saveAsNew = useCallback(
    async (details: ViewDetails) => {
      try {
        const result = await createView({
          variables: { input: viewInput(object, query, details) },
        });
        await refetchViews();
        const id = result.data?.createCrmView.id;
        if (id) {
          selectView(id);
        }
        notify('View "{name}" saved', 'success', { name: details.name });
        return true;
      } catch (error) {
        fail('Could not save the view', error);
        return false;
      }
    },
    [createView, object, query, refetchViews, selectView, notify, fail],
  );

  /** Renames or (un)shares one of the viewer's views, keeping what it filters. */
  const changeDetails = useCallback(
    async (view: CrmViewRow, details: ViewDetails) => {
      try {
        await updateView({
          variables: { id: view.id, input: viewInput(object, queryOfView(view), details) },
        });
        return true;
      } catch (error) {
        fail('Could not update the view', error);
        return false;
      }
    },
    [updateView, object, fail],
  );

  const remove = useCallback(
    async (view: CrmViewRow) => {
      const ok = await confirm({
        title: 'Delete view',
        message: 'Delete the view "{name}"? The records in it are not affected.',
        messageValues: { name: view.name },
        confirmText: 'Delete',
        destructive: true,
      });
      if (!ok) {
        return;
      }
      try {
        await deleteView({ variables: { id: view.id } });
        if (view.id === selectedView?.id) {
          selectView('');
        }
        await refetchViews();
        notify('View "{name}" deleted', 'success', { name: view.name });
      } catch (error) {
        fail('Could not delete the view', error);
      }
    },
    [confirm, deleteView, selectedView, selectView, refetchViews, notify, fail],
  );

  const busy = created.loading || updated.loading || deleted.loading;
  return { saveOver, saveAsNew, changeDetails, remove, busy };
}

export type ViewActions = ReturnType<typeof useViewActions>;
