import type { ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Flex } from '@exyconn/shell/components/ui';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import type { CrudResource } from './useCrudResource';
import { GridExportButton, useGridQuery } from './ExportCsvButton';

interface CrudDashboardProps<TRow, TPaged> {
  title: string;
  subtitle: string;
  /** Lower-case singular entity name; drives "New lead" and the dialog's "Edit lead". */
  entityLabel: string;
  /** Overrides the "New {entityLabel}" header button label. */
  actionLabel?: string;
  stats: StatItem[];
  /**
   * Create/edit/delete state. Omit it for a grid whose rows are made elsewhere — the
   * support console, say — and there is no "New …" button and no create drawer.
   */
  crud?: CrudResource<TRow, TPaged>;
  /** Renders the create/edit form for whichever row the dialog holds. */
  renderForm?: (initial: TRow | null) => ReactNode;
  /** Re-reads the grid when there is no `crud` to carry the signal. */
  refreshSignal?: number;
  columnDefs: ColDef<TPaged>[];
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<TPaged>>;
  /** Handed to ag-grid so the shared cells can reach this page's row handlers. */
  context: object;
  searchPlaceholder: string;
  /** Rendered between the stat tiles and the grid — quick filters, mostly. */
  toolbar?: ReactNode;
  /**
   * Names the CSV an "Export CSV" button above the grid saves — every row under the current
   * search, sort and filters, flattened through `columnDefs`. Omit it and there is no button.
   */
  exportFileName?: string;
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
  refreshSignal,
  columnDefs,
  fetchRows,
  context,
  searchPlaceholder,
  toolbar,
  exportFileName,
  onRowClick,
  extraDialogs,
  children,
}: Readonly<CrudDashboardProps<TRow, TPaged>>) {
  const gridQuery = useGridQuery();
  const dialogTitle = `${crud?.editing ? 'Edit' : 'New'} ${entityLabel}`;
  const createAction = crud
    ? { label: actionLabel ?? `New ${entityLabel}`, open: crud.openCreate }
    : null;
  return (
    <ModuleDashboard
      title={title}
      subtitle={subtitle}
      actionLabel={createAction?.label}
      onAction={createAction?.open}
      stats={stats}
      dialog={
        <>
          {crud && renderForm && (
            <CrudDialog open={crud.open} title={dialogTitle} onClose={crud.close}>
              {renderForm(crud.editing)}
            </CrudDialog>
          )}
          {extraDialogs}
        </>
      }
    >
      {toolbar}
      {exportFileName && (
        <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <GridExportButton
            fileName={exportFileName}
            columnDefs={columnDefs}
            fetchRows={fetchRows}
            getQuery={gridQuery.getQuery}
            context={context}
          />
        </Flex>
      )}
      <ServerDataGrid<TPaged>
        columnDefs={columnDefs}
        fetchRows={fetchRows}
        context={context}
        refreshSignal={crud?.refreshSignal ?? refreshSignal}
        onRowClick={onRowClick}
        searchPlaceholder={searchPlaceholder}
        onQuery={gridQuery.onQuery}
      />
      {children}
    </ModuleDashboard>
  );
}
