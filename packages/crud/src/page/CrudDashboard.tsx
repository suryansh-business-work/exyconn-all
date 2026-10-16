import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useT, type Interpolations } from '@exyconn/i18n';
import { useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ServerDataGrid, type GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import { usePermissions, type PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';
import type { CrudResource } from './useCrudResource';
import { useGridQuery } from './ExportCsvButton';
import { CrudTransferBar } from './CrudTransferBar';
import { contextWithoutActions, deniedActionKeys } from './permissions';
import { RecordCardList } from '../list/RecordCardList';

interface CrudDashboardProps<TRow, TPaged> {
  title: string;
  subtitle: string;
  /** Values for a {placeholder} in the subtitle — see PageHeader's subtitleValues. */
  subtitleValues?: Interpolations;
  /** Lower-case singular entity name; drives "New lead" and the form page's "Edit lead". */
  entityLabel: string;
  /** Overrides the "New {entityLabel}" header button label. */
  actionLabel?: string;
  stats: StatItem[];
  /** True until the stats query first answers — the tiles show placeholders, not zeros. */
  statsLoading?: boolean;
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
  fetchRows: GridFetcher<TPaged>;
  /** Handed to ag-grid so the shared cells can reach this page's row handlers. */
  context: object;
  searchPlaceholder: string;
  /** What the search box holds when the list mounts — a saved view's search, say. */
  initialSearch?: string;
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
  subtitleValues,
  entityLabel,
  actionLabel,
  stats,
  statsLoading,
  crud,
  renderForm,
  refreshSignal,
  columnDefs,
  fetchRows,
  context,
  searchPlaceholder,
  initialSearch,
  toolbar,
  exportFileName,
  permissionModule,
  onRowClick,
  extraDialogs,
  children,
}: Readonly<CrudDashboardProps<TRow, TPaged>>) {
  const gridQuery = useGridQuery();
  const t = useT();
  const theme = useTheme();
  // A thirteen-column table is five screens of sideways scrolling on a phone, so a phone
  // gets the same records as cards instead — same columns, same actions, same query.
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const { can } = usePermissions();
  // No module named means no restriction to apply, exactly as before this prop existed.
  const may = (action: PermissionActionKey) => !permissionModule || can(permissionModule, action);
  const denied = useMemo(
    () => (permissionModule ? deniedActionKeys((action) => can(permissionModule, action)) : []),
    [permissionModule, can],
  );
  const gridContext = useMemo(() => contextWithoutActions(context, denied), [context, denied]);
  // Imported rows re-read the grid: through the resource when there is one, else locally.
  const [imported, setImported] = useState(0);
  const reload = crud?.reload;
  const onImported = useCallback(() => (reload ? reload() : setImported((n) => n + 1)), [reload]);
  const gridRefresh = (crud?.refreshSignal ?? refreshSignal ?? 0) + imported;
  // Built from placeholders rather than by joining words: "New {entity}" is one string a
  // translator can put in their own order, where 'New ' + entityLabel is two they cannot.
  // The noun is translated too — "risk", "invoice" — before it is put into the pattern.
  // Templates and their values go down to the components that translate them — a string
  // translated here and again there would reach the catalogue as a new "English" source.
  const entity = { entity: t(entityLabel) };
  const formTitle = crud?.editing ? 'Edit {entity}' : 'New {entity}';
  const createAction =
    crud && may('create')
      ? {
          label: actionLabel ?? 'New {entity}',
          values: actionLabel ? undefined : entity,
          open: crud.openCreate,
        }
      : null;
  if (crud?.open && renderForm) {
    return (
      <CrudFormPage
        title={formTitle}
        titleValues={entity}
        onBack={crud.close}
        backLabel="Back to {list}"
        backLabelValues={{ list: t(title) }}
      >
        {renderForm(crud.editing)}
      </CrudFormPage>
    );
  }
  return (
    <ModuleDashboard
      title={title}
      subtitle={subtitle}
      subtitleValues={subtitleValues}
      actionLabel={createAction?.label}
      actionLabelValues={createAction?.values}
      onAction={createAction?.open}
      stats={stats}
      statsLoading={statsLoading}
      dialog={extraDialogs}
    >
      {toolbar}
      <CrudTransferBar
        fetchRows={fetchRows}
        columnDefs={columnDefs}
        exportFileName={exportFileName}
        entityLabel={entityLabel}
        gridQuery={gridQuery}
        gridContext={gridContext}
        permissionModule={permissionModule}
        may={may}
        onImported={onImported}
      />
      {onPhone ? (
        <RecordCardList<TPaged>
          columnDefs={columnDefs}
          fetchRows={fetchRows}
          context={gridContext}
          refreshSignal={gridRefresh}
          onRowClick={onRowClick}
          searchPlaceholder={searchPlaceholder}
          initialSearch={initialSearch}
        />
      ) : (
        <ServerDataGrid<TPaged>
          columnDefs={columnDefs}
          fetchRows={fetchRows}
          context={gridContext}
          refreshSignal={gridRefresh}
          onRowClick={onRowClick}
          searchPlaceholder={searchPlaceholder}
          initialSearch={initialSearch}
          onQuery={gridQuery.onQuery}
        />
      )}
      {children}
    </ModuleDashboard>
  );
}
