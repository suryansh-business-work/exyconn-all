import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import type { CrudResource } from './useCrudResource';

interface CrudDashboardProps<TRow, TPaged> {
  title: string;
  subtitle: string;
  /** Lower-case singular entity name; drives "New lead" and the dialog's "Edit lead". */
  entityLabel: string;
  /** Overrides the "New {entityLabel}" header button label. */
  actionLabel?: string;
  stats: StatItem[];
  crud: CrudResource<TRow, TPaged>;
  /** Renders the create/edit form for whichever row the dialog holds. */
  renderForm: (initial: TRow | null) => ReactNode;
  columnDefs: ColDef<TPaged>[];
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<TPaged>>;
  /** Handed to ag-grid so the shared cells can reach this page's row handlers. */
  context: object;
  searchPlaceholder: string;
  onRowClick?: (row: TPaged) => void;
  /** Secondary drawers this module opens from a row action (send, details, …). */
  extraDialogs?: ReactNode;
  /** Extra content rendered under the grid. */
  children?: ReactNode;
}

/**
 * The screen every server-paged CRUD module renders: stat tiles, a create/edit drawer
 * and the server-driven grid, all wired to one {@link useCrudResource}. Modules supply
 * their column model, page fetcher and form; everything else is identical between them.
 */
export function CrudDashboard<TRow, TPaged>({
  title,
  subtitle,
  entityLabel,
  actionLabel,
  stats,
  crud,
  renderForm,
  columnDefs,
  fetchRows,
  context,
  searchPlaceholder,
  onRowClick,
  extraDialogs,
  children,
}: Readonly<CrudDashboardProps<TRow, TPaged>>) {
  const dialogTitle = `${crud.editing ? 'Edit' : 'New'} ${entityLabel}`;
  return (
    <ModuleDashboard
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel ?? `New ${entityLabel}`}
      onAction={crud.openCreate}
      stats={stats}
      dialog={
        <>
          <CrudDialog open={crud.open} title={dialogTitle} onClose={crud.close}>
            {renderForm(crud.editing)}
          </CrudDialog>
          {extraDialogs}
        </>
      }
    >
      <ServerDataGrid<TPaged>
        columnDefs={columnDefs}
        fetchRows={fetchRows}
        context={context}
        refreshSignal={crud.refreshSignal}
        onRowClick={onRowClick}
        searchPlaceholder={searchPlaceholder}
      />
      {children}
    </ModuleDashboard>
  );
}
