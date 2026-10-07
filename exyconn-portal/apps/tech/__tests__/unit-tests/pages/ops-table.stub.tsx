import type { ReactNode } from 'react';

/** A row as the stand-in reads it: an id plus whatever fields the columns name. */
export interface OpsRow {
  id: string;
  [field: string]: unknown;
}

interface OpsColumn {
  key: string;
  label: string;
  render?: (row: never) => ReactNode;
}

interface OpsAction {
  ariaLabel: string;
  tooltip: string;
  onClick: (row: never) => void;
}

/** The DataTable props a page hands over, as the stand-in records them. */
export interface OpsTableProps {
  columns: OpsColumn[];
  rows: OpsRow[];
  actions?: OpsAction[];
  onRowClick?: (row: never) => void;
  emptyMessage?: string;
  loading?: boolean;
  onRefresh?: () => unknown;
}

/** The last props the DataTable stand-in rendered with. */
export const opsTable: { props: OpsTableProps | null } = { props: null };

/** Reads the recorded props, failing the test when no table was rendered. */
export function tableProps(): OpsTableProps {
  if (!opsTable.props) {
    throw new Error('DataTable was not rendered');
  }
  return opsTable.props;
}

function plain(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return '';
}

/**
 * Stands in for the shell's DataTable: one `<tr data-testid="row-<id>">` per row holding the
 * page's own cell renderers, a button per row action (named by aria-label) and an "open"
 * button that runs `onRowClick`.
 */
function DataTableStub(props: Readonly<OpsTableProps>) {
  opsTable.props = props;
  if (props.rows.length === 0) {
    return <p>{props.emptyMessage}</p>;
  }
  return (
    <table>
      <tbody>
        {props.rows.map((row) => (
          <tr key={row.id} data-testid={`row-${row.id}`}>
            {props.columns.map((column) => (
              <td key={column.key} data-testid={`${row.id}-${column.key}`}>
                {column.render ? column.render(row as never) : plain(row[column.key])}
              </td>
            ))}
            <td>
              {(props.actions ?? []).map((action) => (
                <button
                  key={action.ariaLabel}
                  type="button"
                  aria-label={action.ariaLabel}
                  onClick={() => action.onClick(row as never)}
                >
                  {action.tooltip}
                </button>
              ))}
              {props.onRowClick ? (
                <button type="button" onClick={() => props.onRowClick?.(row as never)}>
                  open {row.id}
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
