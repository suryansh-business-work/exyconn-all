import type { ColDef } from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import { Flex } from '@exyconn/shell/components/ui';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import { useTableInfo } from '@exyconn/shell/components/data/useTableInfo';
import type { PermissionActionKey } from '@exyconn/shell/hooks/usePermissions';
import { GridTransferBar } from '../transfer/GridTransferBar';
import { GridExportButton, type GridQueryTracker } from './ExportCsvButton';

interface CrudTransferBarProps<Row> {
  fetchRows: GridFetcher<Row>;
  columnDefs: readonly ColDef<Row>[];
  /** Names exported files; without it there is no export. */
  exportFileName?: string;
  /** The entity's lower-case singular label, for the import dialog's title. */
  entityLabel: string;
  gridQuery: GridQueryTracker;
  gridContext: object;
  permissionModule?: string;
  may: (action: PermissionActionKey) => boolean;
  onImported: () => void;
}

/**
 * Export and import above a dashboard's grid. A grid on a registered paged list exports on the
 * server (CSV or Excel) and imports when the server opens the list to it; a grid on its own
 * query input keeps the CSV export built from its pages.
 */
export function CrudTransferBar<Row>({
  fetchRows,
  columnDefs,
  exportFileName,
  entityLabel,
  gridQuery,
  gridContext,
  permissionModule,
  may,
  onImported,
}: Readonly<CrudTransferBarProps<Row>>) {
  const t = useT();
  const info = useTableInfo(fetchRows.list);
  const canExport = Boolean(exportFileName) && may('export');
  if (fetchRows.list) {
    return (
      <GridTransferBar
        list={fetchRows.list}
        info={info}
        columnDefs={columnDefs}
        fileName={exportFileName ?? entityLabel}
        title={t('Import {entity} records', { entity: t(entityLabel) })}
        getQuery={gridQuery.getQuery}
        canExport={canExport}
        canImport={may('create')}
        canEdit={may('edit')}
        onImported={onImported}
      />
    );
  }
  if (!exportFileName || !canExport) {
    return null;
  }
  return (
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
  );
}
