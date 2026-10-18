import {
  TableBulkAction,
  type TableBulkActionMutation,
  type TableBulkActionMutationVariables,
} from '@/graphql/generated';

/** The most ids the server takes in one `tableBulkAction` call. */
const BULK_CHUNK = 200;

type BulkResult = TableBulkActionMutation['tableBulkAction'];

/** Runs one bulk call and returns its result; the hook supplies the Apollo mutation. */
export type BulkCall = (variables: TableBulkActionMutationVariables) => Promise<BulkResult>;

/**
 * Applies an action to every selected id, at most {@link BULK_CHUNK} per request, one request
 * after another so the server is never handed several guard-and-audit runs at once.
 * `onProgress` hears how many ids have been sent after each request.
 */
export async function applyBulk(
  call: BulkCall,
  list: string,
  ids: readonly string[],
  action: TableBulkAction,
  onProgress?: (done: number) => void,
): Promise<BulkResult> {
  let succeeded = 0;
  const failures: BulkResult['failures'] = [];
  for (let start = 0; start < ids.length; start += BULK_CHUNK) {
    const chunk = ids.slice(start, start + BULK_CHUNK);
    const result = await call({ list, ids: chunk, action });
    succeeded += result.succeeded;
    failures.push(...result.failures);
    onProgress?.(start + chunk.length);
  }
  return { succeeded, failures };
}

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
  /** The toast once every row went through. */
  done: string;
  /** The bar's progress line while the requests run. */
  progress: string;
}

/** The bar's progress line while "Select all matching" reads the ids it will act on. */
export const COLLECTING_PROGRESS = 'Collecting rows… {done} of {total}';

/** Why "Select all matching" refuses a set larger than it acts on. */
export const TOO_MANY_MATCHING =
  'More than {max} rows match. Narrow the search or filters to {max} or fewer and try again.';

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
    progress: 'Deleting… {done} of {total}',
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
    progress: 'Archiving… {done} of {total}',
  },
  [TableBulkAction.Restore]: {
    confirm: null,
    done: '{count} rows restored',
    progress: 'Restoring… {done} of {total}',
  },
};

/** The selected rows' ids, read off each row's `id`. */
export function selectedIdsOf(rows: readonly unknown[]): string[] {
  return rows.flatMap((row) => {
    const id = (row as { id?: unknown } | null)?.id;
    return typeof id === 'string' || typeof id === 'number' ? [String(id)] : [];
  });
}
