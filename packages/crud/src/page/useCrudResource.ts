import { useCallback, useState } from 'react';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudDialog } from '@exyconn/shell/hooks/useCrudDialog';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useT, type Interpolations } from '@exyconn/i18n';

/** A confirm prompt: plain English, or a `{placeholder}` template with its values. */
export type ConfirmCopy = string | { message: string; values: Interpolations };

export interface UseCrudResourceOptions<TTarget> {
  /** Sentence-case entity name used in the toast, e.g. "Lead" → "Lead deleted". */
  label: string;
  /** Runs the delete mutation for one row. */
  onDelete: (row: TTarget) => Promise<unknown>;
  /**
   * Prompt shown in the confirm dialog before the delete. A prompt naming the record returns
   * the template and its values — `{ message: 'Delete "{name}"?', values: { name } }` — so the
   * catalogue holds one sentence, not one per record.
   */
  confirmMessage: (row: TTarget) => ConfirmCopy;
  /** Re-reads the page's own data (its stats or list query) after a mutation. */
  refetch?: () => Promise<unknown>;
}

export interface CrudResource<TRow, TTarget> {
  open: boolean;
  editing: TRow | null;
  openCreate: () => void;
  openEdit: (row: TRow) => void;
  close: () => void;
  /** Bump counter handed to {@link ServerDataGrid} so it re-reads the current page. */
  refreshSignal: number;
  /** Re-reads the grid and the page's own query. */
  reload: () => void;
  /** Reloads and closes the dialog — hand straight to a form's `onDone`. */
  onDone: () => void;
  /** Confirms, deletes, reloads and reports — hand to the grid's `delete` action. */
  remove: (row: TTarget) => Promise<void>;
}

/**
 * Everything a CRUD list page does around its grid: create/edit dialog state, the
 * confirm-then-delete flow, and the reload that follows any mutation. `TTarget` is the
 * paged row type when the grid's rows differ from the form's row type.
 */
export function useCrudResource<TRow, TTarget = TRow>({
  label,
  onDelete,
  confirmMessage,
  refetch,
}: UseCrudResourceOptions<TTarget>): CrudResource<TRow, TTarget> {
  const dialog = useCrudDialog<TRow>();
  const { close } = dialog;
  const confirm = useConfirm();
  const notify = useNotify();
  const t = useT();
  const [refreshSignal, setRefreshSignal] = useState(0);

  const reload = useCallback(() => {
    setRefreshSignal((signal) => signal + 1);
    refetch?.().catch((error: unknown) => notify(errorMessage(error, 'Reload failed'), 'error'));
  }, [refetch, notify]);

  const onDone = useCallback(() => {
    reload();
    close();
  }, [reload, close]);

  const remove = async (row: TTarget) => {
    // Built here rather than left to the notifier: "Lead deleted" glued together would be a
    // different catalogue key for every entity in the portal, and none of them a sentence.
    const copy = confirmMessage(row);
    const prompt =
      typeof copy === 'string'
        ? { message: copy }
        : { message: copy.message, messageValues: copy.values };
    const ok = await confirm({ ...prompt, confirmText: 'Delete' });
    if (!ok) {
      return;
    }
    try {
      await onDelete(row);
      reload();
      notify('{entity} deleted', 'success', { entity: t(label) });
    } catch (error) {
      notify(errorMessage(error, 'Delete failed'), 'error');
    }
  };

  return { ...dialog, refreshSignal, reload, onDone, remove };
}
