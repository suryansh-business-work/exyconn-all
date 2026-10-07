import type { ReactNode } from 'react';
import { vi } from 'vitest';
import { forms } from './stub-modules';

export { dialogModule, formModule, forms, panelModule, propsModule, propsOf } from './stub-modules';

/** A table row as the stand-in reads it: an id and whatever fields the panel's columns name. */
export interface StubRow {
  id: string;
  [field: string]: unknown;
}

interface StubColumn {
  key: string;
  label: string;
  render?: (row: StubRow) => ReactNode;
}

interface StubAction {
  ariaLabel: string;
  tooltip: string;
  onClick: (row: StubRow) => void;
  hidden?: (row: StubRow) => boolean;
}

/** The DataTable props a panel hands over, as the stand-in records them. */
export interface StubTableProps {
  columns: StubColumn[];
  rows: StubRow[];
  actions?: StubAction[];
  onEdit?: (row: StubRow) => void;
  onDelete?: (row: StubRow) => void;
  emptyMessage?: string;
  loading?: boolean;
  onRefresh?: () => Promise<unknown>;
}

/** The last props the DataTable stand-in rendered with. */
export const table: { props: StubTableProps | null } = { props: null };

function cellText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

/**
 * Stands in for the shell's DataTable: one `<tr data-testid="row-<id>">` per row holding the
 * panel's own cell renderers, its visible custom actions (named by aria-label) and Edit/Delete.
 */
export function DataTableStub(props: Readonly<StubTableProps>) {
  table.props = props;
  if (props.rows.length === 0) {
    return <p>{props.emptyMessage}</p>;
  }
  return (
    <table>
      <tbody>
        {props.rows.map((row) => (
          <tr key={row.id} data-testid={`row-${row.id}`}>
            {props.columns.map((column) => (
              <td key={column.key}>
                {column.render ? column.render(row) : cellText(row[column.key])}
              </td>
            ))}
            <td>
              {(props.actions ?? [])
                .filter((action) => !action.hidden?.(row))
                .map((action) => (
                  <button
                    key={action.ariaLabel}
                    type="button"
                    aria-label={action.ariaLabel}
                    onClick={() => action.onClick(row)}
                  >
                    {action.tooltip}
                  </button>
                ))}
              {props.onEdit ? (
                <button type="button" onClick={() => props.onEdit?.(row)}>
                  Edit
                </button>
              ) : null}
              {props.onDelete ? (
                <button type="button" onClick={() => props.onDelete?.(row)}>
                  Delete
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The `@exyconn/shell/components/data/DataTable` module with the stand-in in place. */
export function dataTableModule() {
  return { DataTable: DataTableStub };
}

/** The toast spy every panel's `useNotify` returns. */
export const notify = vi.fn();

/** The notification module with `useNotify` replaced; the provider itself stays real. */
export async function notifyModule(importOriginal: () => Promise<object>) {
  return { ...(await importOriginal()), useNotify: () => notify };
}

/** What `useCrudResource` was called with on the last render. */
export interface ResourceOptions {
  label: string;
  onDelete: (row: StubRow) => Promise<unknown>;
  confirmMessage: (row: StubRow) => unknown;
  refetch?: unknown;
}

/** Whether the stand-in reports the form as open, and on which record. */
export const crudState: { open: boolean; editing: StubRow | null } = {
  open: false,
  editing: null,
};

/** The handlers the stand-in `useCrudResource` returns. */
export const crud = {
  openCreate: vi.fn(),
  openEdit: vi.fn(),
  close: vi.fn(),
  onDone: vi.fn(),
  remove: vi.fn(),
  reload: vi.fn(),
  refreshSignal: 7,
};

/** The recorders behind the `@exyconn/crud` stand-in. */
export const recorded: {
  resource: ResourceOptions | null;
  fetcher: { document: unknown; select: (data: unknown) => unknown } | null;
} = { resource: null, fetcher: null };

/** The fetcher the stand-in `usePagedFetcher` returns. */
export const fetchRows = vi.fn();

/**
 * `@exyconn/crud` with `useCrudResource` and `usePagedFetcher` replaced by recorders (they need
 * the confirm dialog and an Apollo client); the column helpers stay real.
 */
export async function crudModule() {
  const actual = await vi.importActual<object>('@exyconn/crud');
  return {
    ...actual,
    useCrudResource: (options: ResourceOptions) => {
      recorded.resource = options;
      return { ...crud, open: crudState.open, editing: crudState.editing };
    },
    usePagedFetcher: (document: unknown, select: (data: unknown) => unknown) => {
      recorded.fetcher = { document, select };
      return fetchRows;
    },
  };
}

/** Reads the recorded resource options, failing when the panel never asked for one. */
export function resourceOptions(): ResourceOptions {
  if (!recorded.resource) {
    throw new Error('useCrudResource was not called');
  }
  return recorded.resource;
}

/** Resets every recorder between tests. */
export function resetHarness() {
  table.props = null;
  recorded.resource = null;
  recorded.fetcher = null;
  crudState.open = false;
  crudState.editing = null;
  notify.mockReset();
  fetchRows.mockReset();
  for (const fn of [crud.openCreate, crud.openEdit, crud.close, crud.onDone, crud.remove]) {
    fn.mockReset();
  }
  for (const key of Object.keys(forms)) {
    delete forms[key];
  }
}
