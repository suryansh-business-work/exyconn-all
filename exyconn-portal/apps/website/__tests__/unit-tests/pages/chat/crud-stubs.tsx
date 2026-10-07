import type { ReactNode } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

type RowAction = (row: object) => Promise<void> | void;

/** The CrudDashboard props the Chatbot pages hand over, as the stand-in records them. */
export interface DashboardProps {
  title: string;
  subtitle: string;
  entityLabel: string;
  actionLabel?: string;
  exportFileName: string;
  stats: StatItem[];
  statsLoading?: boolean;
  crud: { open: boolean; editing: unknown; openCreate: () => void };
  renderForm: (initial: never) => ReactNode;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowAction>; formatDate?: (value: string) => string };
  searchPlaceholder: string;
  toolbar?: ReactNode;
}

/** The last props the stand-in rendered with. */
export const dashboard: { props: DashboardProps | null } = { props: null };

export function dashboardProps(): DashboardProps {
  if (!dashboard.props) throw new Error('CrudDashboard was not rendered');
  return dashboard.props;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props, lists the stat tiles as "label: value", renders the page's toolbar and,
 * while the CRUD state is open, the page's form.
 */
export function CrudDashboardStub(props: Readonly<DashboardProps>) {
  dashboard.props = props;
  return (
    <div>
      <h1>{props.title}</h1>
      {props.toolbar}
      <ul aria-label="stats">
        {props.stats.map((stat) => (
          <li key={stat.label}>{`${stat.label}: ${stat.value}`}</li>
        ))}
      </ul>
      <button type="button" onClick={props.crud.openCreate}>
        Open new form
      </button>
      {props.crud.open && props.renderForm(props.crud.editing as never)}
    </div>
  );
}

/** What the page handed to usePagedFetcher. */
export const paged: { document: DocumentNode | null; select: ((data: never) => unknown) | null } = {
  document: null,
  select: null,
};

/** Stands in for usePagedFetcher: records the document and the page picker it was given. */
export function usePagedFetcherStub(document: DocumentNode, select: (data: never) => unknown) {
  paged.document = document;
  paged.select = select;
  return paged;
}

export interface FormStubProps {
  initial?: unknown;
  onCancel: () => void;
  onDone: () => void;
}

/** Stands in for a module form: shows the record it opened with and the page's callbacks. */
export function FormStub({ initial, onCancel, onDone }: Readonly<FormStubProps>) {
  return (
    <div>
      <p>{initial ? `Form for ${JSON.stringify(initial)}` : 'Blank form'}</p>
      <button type="button" onClick={onCancel}>
        Cancel form
      </button>
      <button type="button" onClick={onDone}>
        Finish form
      </button>
    </div>
  );
}

/** The grid hands every formatter the viewer's translator; English in, English out here. */
const gridContext = { t: (source: string) => source };

/** Field (or colId) of every column, left to right. */
export function columnIds<TRow>(columns: ColDef<TRow>[]): (string | undefined)[] {
  return columns.map((column) => column.field ?? column.colId);
}

function columnFor<TRow>(columns: ColDef<TRow>[], field: string): ColDef<TRow> {
  const column = columns.find((candidate) => candidate.field === field);
  if (!column) throw new Error(`No ${field} column`);
  return column;
}

/** The text a column's formatter writes for a row, called the way ag-grid calls it. */
export function formatCell<TRow>(columns: ColDef<TRow>[], field: string, row: TRow): string {
  const format = columnFor(columns, field).valueFormatter;
  if (typeof format !== 'function') throw new Error(`Column ${field} has no formatter`);
  return format({ data: row, context: gridContext } as ValueFormatterParams<TRow>);
}

/** The value a status column derives for a row (what its chip shows). */
export function cellValue<TRow>(columns: ColDef<TRow>[], field: string, row: TRow): unknown {
  const getter = columnFor(columns, field).valueGetter;
  if (typeof getter !== 'function') throw new Error(`Column ${field} has no value getter`);
  return getter({ data: row, context: gridContext } as ValueGetterParams<TRow>);
}

/** The row action keys pinned to the trailing actions column. */
export function actionKeys<TRow>(columns: ColDef<TRow>[]): string[] {
  const params = columns.find((column) => column.colId === 'actions')?.cellRendererParams as
    { actionSpecs: Array<{ key: string }> } | undefined;
  if (!params) throw new Error('The grid has no actions column');
  return params.actionSpecs.map((action) => action.key);
}
