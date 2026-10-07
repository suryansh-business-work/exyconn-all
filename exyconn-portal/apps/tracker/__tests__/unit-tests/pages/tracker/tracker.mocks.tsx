import type { ReactNode } from 'react';
import type { Column, RowAction } from '@exyconn/shell/components/data/DataTable';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import type { TabberProps } from '@exyconn/tabber';

/** A table row as the stand-in table reads it: an id plus whatever the page's columns name. */
export type StubRow = { id: string } & Record<string, unknown>;

/** The DataTable props a tracker page hands over. */
export interface TableProps {
  columns: Column<StubRow>[];
  rows: StubRow[];
  actions?: RowAction<StubRow>[];
  onRowClick?: (row: StubRow) => void;
  emptyMessage?: string;
  loading?: boolean;
  onRefresh?: () => Promise<unknown>;
}

/** The ModuleDashboard props a tracker page hands over. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  stats: StatItem[];
  statsLoading?: boolean;
  children: ReactNode;
}

/** The ExportCsvButton props a billing view hands over. */
export interface CsvProps {
  fileName: string;
  columns: ReadonlyArray<{ header: string }>;
  loadRows: () => Promise<unknown[]>;
}

/** What the stand-ins saw on the last render. */
export const recorded: {
  table: TableProps | null;
  dashboard: DashboardProps | null;
  tabber: TabberProps | null;
  csv: CsvProps | null;
} = { table: null, dashboard: null, tabber: null, csv: null };

export function resetRecorded() {
  recorded.table = null;
  recorded.dashboard = null;
  recorded.tabber = null;
  recorded.csv = null;
}

/** Reads a recorded value, failing loudly when the page never rendered that stand-in. */
function required<T>(value: T | null, what: string): T {
  if (value === null) {
    throw new Error(`${what} was not rendered`);
  }
  return value;
}

export const tableProps = () => required(recorded.table, 'DataTable');
export const dashboardProps = () => required(recorded.dashboard, 'ModuleDashboard');
export const tabberProps = () => required(recorded.tabber, 'Tabber');
export const csvProps = () => required(recorded.csv, 'ExportCsvButton');

/** The stat tiles as label/value pairs, in order. */
export const statPairs = () => dashboardProps().stats.map((stat) => [stat.label, stat.value]);

/** The viewer's formatters, as `useSettings` would hand them over — recognisable in output. */
export const formatDate = (value: string) => `on ${value}`;
export const formatTime = (value: string) => `time ${value}`;
export const formatDateTime = (value: string) => `at ${value}`;

/** Factory for `vi.mock('@exyconn/shell/hooks/useSettings', …)`. */
export function settingsModuleMock() {
  return {
    useSettings: () => ({
      settings: { timezone: 'Asia/Kolkata', dateFormat: 'dd MMM yyyy', timeFormat: 'HH:mm' },
      formatDate,
      formatTime,
      formatDateTime,
    }),
  };
}

function cellOf(column: Column<StubRow>, row: StubRow): ReactNode {
  if (column.render) {
    return column.render(row);
  }
  return String(row[column.key] ?? '');
}

/** Stands in for the shell's DataTable: every cell, every row action, and a row opener. */
function DataTableStub(props: Readonly<TableProps>) {
  recorded.table = props;
  const { columns, rows, actions, onRowClick } = props;
  return (
    <table>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td key={column.key}>{cellOf(column, row)}</td>
            ))}
            <td>
              {actions?.map((action) => (
                <button
                  key={action.ariaLabel}
                  type="button"
                  aria-label={action.ariaLabel}
                  onClick={() => action.onClick(row)}
                >
                  {action.tooltip}
                </button>
              ))}
              {onRowClick ? (
                <button type="button" onClick={() => onRowClick(row)}>
                  {`Open ${row.id}`}
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Factory for `vi.mock('@exyconn/shell/components/data/DataTable', …)`. */
export const dataTableModuleMock = () => ({ DataTable: DataTableStub });

/** Factory for `vi.mock('@exyconn/shell/components/dashboard/ModuleDashboard', …)`. */
export const moduleDashboardMock = () => ({
  ModuleDashboard: (props: Readonly<DashboardProps>) => {
    recorded.dashboard = props;
    return <section aria-label={props.title}>{props.children}</section>;
  },
});

/** Factory for `vi.mock('@exyconn/tabber', …)`: every tab's label and content, all at once. */
export const tabberModuleMock = () => ({
  Tabber: (props: Readonly<TabberProps>) => {
    recorded.tabber = props;
    return (
      <nav aria-label={props.ariaLabel}>
        {props.items.map((item) => (
          <section key={item.slug} aria-label={item.label}>
            {item.content}
          </section>
        ))}
      </nav>
    );
  },
});

/** Factory for `vi.mock('@exyconn/crud', …)`: the export button, recorded rather than run. */
export const crudModuleMock = () => ({
  ExportCsvButton: (props: Readonly<CsvProps>) => {
    recorded.csv = props;
    return <button type="button">Export CSV</button>;
  },
});

interface DatePickerStubProps {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
}

/** The instant the stand-in picker hands back for "Pick" — local midnight, as MUIX does. */
export const PICKED = new Date(2026, 1, 10);

/** Stands in for the MUIX DatePicker: shows its value and offers a pick, a half-typed date and a clear. */
function DatePickerStub({ label, value, onChange }: Readonly<DatePickerStubProps>) {
  return (
    <fieldset aria-label={label}>
      <output>{value?.toISOString() ?? ''}</output>
      <button type="button" onClick={() => onChange(PICKED)}>
        Pick
      </button>
      <button type="button" onClick={() => onChange(new Date('half-typed'))}>
        Half-type
      </button>
      <button type="button" onClick={() => onChange(null)}>
        Clear
      </button>
    </fieldset>
  );
}

/** Factory for `vi.mock('@exyconn/ui/pickers', …)`: the real module with the DatePicker swapped. */
export async function pickersModuleMock(original: () => Promise<object>) {
  return { ...(await original()), DatePicker: DatePickerStub };
}
