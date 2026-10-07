import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';

type RowAction = (row: never) => unknown;

/** The CrudDashboard props the CMS pages hand over, as the stand-in records them. */
export interface CrudDashboardProps {
  title: string;
  subtitle: string;
  subtitleValues?: Record<string, string>;
  entityLabel: string;
  actionLabel?: string;
  exportFileName?: string;
  crud: { open: boolean; editing: unknown; openCreate: () => void };
  renderForm: (initial: never) => ReactNode;
  columnDefs: ColDef[];
  fetchRows: unknown;
  context: { actions: Record<string, RowAction>; formatDate?: (value: string) => string };
  searchPlaceholder: string;
  onRowClick?: (row: never) => void;
  toolbar?: ReactNode;
  extraDialogs?: ReactNode;
}

/** The last props the CrudDashboard stand-in rendered with. */
export const crudDashboard: { props: CrudDashboardProps | null } = { props: null };

/** Reads the recorded props, failing the test when the page never rendered the dashboard. */
export function crudProps(): CrudDashboardProps {
  if (!crudDashboard.props) throw new Error('CrudDashboard was not rendered');
  return crudDashboard.props;
}

/**
 * Stands in for `@exyconn/crud`'s CrudDashboard (ag-grid does not lay out under jsdom): it
 * records its props and renders what the real one renders from the page's own props — the
 * form while the CRUD state is open, the toolbar and the page's extra dialogs.
 */
export function CrudDashboardStub(props: Readonly<CrudDashboardProps>) {
  crudDashboard.props = props;
  return (
    <div>
      <h1>{props.title}</h1>
      <button type="button" onClick={props.crud.openCreate}>
        Open new form
      </button>
      {props.toolbar}
      {props.crud.open && props.renderForm(props.crud.editing as never)}
      {props.extraDialogs}
    </div>
  );
}

/** The ModuleDashboard props the CMS list pages hand over. */
export interface ModuleDashboardProps {
  title: string;
  subtitle: string;
  subtitleValues?: Record<string, string>;
  actionLabel?: string;
  onAction?: () => void;
  stats: StatItem[];
  statsLoading?: boolean;
  children: ReactNode;
}

/** The last props the ModuleDashboard stand-in rendered with. */
export const moduleDashboard: { props: ModuleDashboardProps | null } = { props: null };

/** The stat tiles as `label → value`. */
export function statTiles(): Record<string, string> {
  if (!moduleDashboard.props) throw new Error('ModuleDashboard was not rendered');
  return Object.fromEntries(moduleDashboard.props.stats.map((stat) => [stat.label, stat.value]));
}

/** Stands in for the shell's ModuleDashboard: the title, the action and the page's table. */
export function ModuleDashboardStub(props: Readonly<ModuleDashboardProps>) {
  moduleDashboard.props = props;
  return (
    <main>
      <h1>{props.title}</h1>
      {props.actionLabel && (
        <button type="button" onClick={props.onAction}>
          {props.actionLabel}
        </button>
      )}
      {props.children}
    </main>
  );
}
