import { useMemo, type ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Flex } from '@exyconn/shell/components/ui';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import {
  ServerDataGrid,
  type TablePageResult,
} from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import { usePermissions, type PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';
import type { CrudResource } from './useCrudResource';
import { GridExportButton, useGridQuery } from './ExportCsvButton';
import { contextWithoutActions, deniedActionKeys } from './permissions';

interface CrudDashboardProps<TRow, TPaged> {
  title: string;
  subtitle: string;
  /** Lower-case singular entity name; drives "New lead" and the form page's "Edit lead". */
  entityLabel: string;
  /** Overrides the "New {entityLabel}" header button label. */
  actionLabel?: string;
  stats: StatItem[];
  /**
   * Create/edit/delete state. Omit it for a grid whose rows are made elsewhere — the
   * support console, say — and there is no "New …" button and no create form.
   */
  crud?: CrudResource<TRow, TPaged>;
  /** Renders the create/edit form for whichever row is being created or edited. */
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
  /**
   * The module this screen is restricted under in Admin › Roles & Permissions. Set it and
   * the New button, the edit/delete row actions and the export button each disappear when
   * the viewer's role has that action switched off. The server enforces the same rules —
   * this only stops the screen offering what it would refuse.
   */
  permissionModule?: string;
  onRowClick?: (row: TPaged) => void;
  /** Secondary drawers this module opens from a row action (send, details, …). */
  extraDialogs?: ReactNode;
  /** Extra content rendered under the grid. */
  children?: ReactNode;
}

/**
 * The screen every server-paged CRUD module renders: stat tiles, the server-driven grid
 * and a create/edit form, all wired to one {@link useCrudResource}. Modules supply their
 * column model, page fetcher and form; everything else is identical between them.
 *
 * Creating and editing take over the whole screen instead of opening a drawer — the list
 * comes back from the header's Back link or the browser's own Back button.
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
  permissionModule,
  onRowClick,
  extraDialogs,
  children,
}: Readonly<CrudDashboardProps<TRow, TPaged>>) {
  const gridQuery = useGridQuery();
  const { can } = usePermissions();
  // No module named means no restriction to apply, exactly as before this prop existed.
  const may = (action: PermissionActionKey) => !permissionModule || can(permissionModule, action);
  const denied = useMemo(
    () => (permissionModule ? deniedActionKeys((action) => can(permissionModule, action)) : []),
    [permissionModule, can],
  );
  const gridContext = useMemo(() => contextWithoutActions(context, denied), [context, denied]);
  const formTitle = `${crud?.editing ? 'Edit' : 'New'} ${entityLabel}`;
  const createAction =
    crud && may('create')
      ? { label: actionLabel ?? `New ${entityLabel}`, open: crud.openCreate }
      : null;
  if (crud?.open && renderForm) {
    return (
      <CrudFormPage title={formTitle} onBack={crud.close} backLabel={`Back to ${title}`}>
        {renderForm(crud.editing)}
      </CrudFormPage>
    );
  }
  return (
    <ModuleDashboard
      title={title}
      subtitle={subtitle}
      actionLabel={createAction?.label}
      onAction={createAction?.open}
      stats={stats}
      dialog={extraDialogs}
    >
      {toolbar}
      {exportFileName && may('export') && (
        <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <GridExportButton
            fileName={exportFileName}
            columnDefs={columnDefs}
            fetchRows={fetchRows}
            getQuery={gridQuery.getQuery}
            context={gridContext}
            permissionModule={permissionModule}
          />
        </Flex>
      )}
      <ServerDataGrid<TPaged>
        columnDefs={columnDefs}
        fetchRows={fetchRows}
        context={gridContext}
        refreshSignal={crud?.refreshSignal ?? refreshSignal}
        onRowClick={onRowClick}
        searchPlaceholder={searchPlaceholder}
        onQuery={gridQuery.onQuery}
      />
      {children}
    </ModuleDashboard>
  );
}
