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
 */
export async function applyBulk(
  call: BulkCall,
  list: string,
  ids: readonly string[],
  action: TableBulkAction,
): Promise<BulkResult> {
  let succeeded = 0;
  const failures: BulkResult['failures'] = [];
  for (let start = 0; start < ids.length; start += BULK_CHUNK) {
    const result = await call({ list, ids: ids.slice(start, start + BULK_CHUNK), action });
    succeeded += result.succeeded;
    failures.push(...result.failures);
  }
  return { succeeded, failures };
}

interface BulkCopy {
  /** The confirm prompt; null runs the action without asking (restoring loses nothing). */
  confirm: { message: string; confirmText: string; destructive: boolean } | null;
  /** The toast once every row went through. */
  done: string;
}

/** What each action asks first and says afterwards — English sources, translated on display. */
export const BULK_COPY: Readonly<Record<TableBulkAction, BulkCopy>> = {
  [TableBulkAction.Delete]: {
    confirm: {
      message: 'Delete {count} selected rows? This cannot be undone.',
      confirmText: 'Delete',
      destructive: true,
    },
    done: '{count} rows deleted',
  },
  [TableBulkAction.Archive]: {
    confirm: {
      message:
        'Archive {count} selected rows? They leave this list; switch on Archived to see or restore them.',
      confirmText: 'Archive',
      destructive: false,
    },
    done: '{count} rows archived',
  },
  [TableBulkAction.Restore]: { confirm: null, done: '{count} rows restored' },
};

/** The selected rows' ids, read off each row's `id`. */
export function selectedIdsOf(rows: readonly unknown[]): string[] {
  return rows.flatMap((row) => {
    const id = (row as { id?: unknown } | null)?.id;
    return typeof id === 'string' || typeof id === 'number' ? [String(id)] : [];
  });
}
