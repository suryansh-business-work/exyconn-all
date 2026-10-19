import { TableBulkAction } from '@/graphql/generated';

interface BulkCopy {
  /**
   * The confirm prompt — `message` for the selected rows, `matchingMessage` once every row
   * matching the filters is selected; null runs the action without asking (restoring loses
   * nothing).
   */
  confirm: {
    message: string;
    matchingMessage: string;
    confirmText: string;
    destructive: boolean;
  } | null;
  /** The toast once the job is done and every row went through. */
  done: string;
  /** The toolbar's progress line while the job works through the rows. */
  progress: string;
}

/** What each action asks first and says afterwards — English sources, translated on display. */
export const BULK_COPY: Readonly<Record<TableBulkAction, BulkCopy>> = {
  [TableBulkAction.Delete]: {
    confirm: {
      message: 'Delete {count} selected rows? This cannot be undone.',
      matchingMessage: 'Delete {count} rows matching the current filters? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    },
    done: '{count} rows deleted',
    progress: 'Deleting {done} of {total}…',
  },
  [TableBulkAction.Archive]: {
    confirm: {
      message:
        'Archive {count} selected rows? They leave this list; switch on Archived to see or restore them.',
      matchingMessage:
        'Archive {count} rows matching the current filters? They leave this list; switch on Archived to see or restore them.',
      confirmText: 'Archive',
      destructive: false,
    },
    done: '{count} rows archived',
    progress: 'Archiving {done} of {total}…',
  },
  [TableBulkAction.Restore]: {
    confirm: null,
    done: '{count} rows restored',
    progress: 'Restoring {done} of {total}…',
  },
};

/** The selected rows' ids, read off each row's `id`. */
export function selectedIdsOf(rows: readonly unknown[]): string[] {
  return rows.flatMap((row) => {
    const id = (row as { id?: unknown } | null)?.id;
    return typeof id === 'string' || typeof id === 'number' ? [String(id)] : [];
  });
}
