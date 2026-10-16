import { useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import UploadIcon from '@mui/icons-material/Upload';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import type { GridQuery } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableInfo } from '@exyconn/shell/components/data/tableColumns';
import { ImportDialog } from '../import';
import { ExportMenuButton } from './ExportMenuButton';
import { useGridTransfer } from './useGridTransfer';

interface GridTransferBarProps<Row> {
  list: string;
  info: TableInfo | null;
  columnDefs: readonly ColDef<Row>[];
  fileName: string;
  /** The import dialog's title, already translated. */
  title: string;
  getQuery: () => GridQuery;
  canExport: boolean;
  canImport: boolean;
  canEdit: boolean;
  /** Runs after every chunk an import wrote, so the grid can re-read. */
  onImported: () => void;
}

/** Export and Import above a server-paged grid, each shown only when the viewer may use it. */
export function GridTransferBar<Row>({
  canExport,
  canImport,
  onImported,
  ...options
}: Readonly<GridTransferBarProps<Row>>) {
  const t = useT();
  const [importing, setImporting] = useState(false);
  const { exportFile, source } = useGridTransfer(options);
  const importSource = canImport ? source : null;
  if (!canExport && !importSource) {
    return null;
  }
  return (
    <Flex direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 1 }}>
      {canExport && <ExportMenuButton onExport={exportFile} />}
      {importSource && (
        <Button size="small" startIcon={<UploadIcon />} onClick={() => setImporting(true)}>
          {t('Import')}
        </Button>
      )}
      {importSource && importing && (
        <ImportDialog
          source={importSource}
          onImported={onImported}
          onClose={() => setImporting(false)}
        />
      )}
    </Flex>
  );
}
