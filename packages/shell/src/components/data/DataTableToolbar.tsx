import type { ReactNode } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import { useT } from '@exyconn/i18n';
import { Box, Button, Typography } from '@/components/ui';
import { BulkJobStatus } from './BulkJobStatus';
import { TableRefreshButton } from './TableRefreshButton';
import type { DataTableBulk } from './useDataTableBulk';

interface DataTableToolbarProps {
  loading: boolean;
  onRefresh?: () => Promise<unknown>;
  /** Present when rows can be ticked and deleted together. */
  bulk?: DataTableBulk;
  /** The page's own buttons for the ticked rows. */
  selectionActions?: (selectedIds: readonly string[]) => ReactNode;
}

/** What is selected and what can be done to it, announced politely as it changes. */
function SelectionControls({
  bulk,
  selectionActions,
}: Readonly<Pick<DataTableToolbarProps, 'selectionActions'> & { bulk: DataTableBulk }>) {
  const t = useT();
  const count = bulk.selectedIds.length;
  return (
    <>
      <Typography variant="body2" role="status" aria-live="polite" sx={{ mr: 'auto' }}>
        {count > 0 ? t('{count} selected', { count }) : ''}
      </Typography>
      {count > 0 && (
        <>
          {selectionActions?.(bulk.selectedIds)}
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => bulk.deleteSelected()}
            disabled={bulk.job.running}
          >
            {t('Delete selected')}
          </Button>
          <Button size="small" startIcon={<ClearIcon />} onClick={bulk.clear}>
            {t('Clear selection')}
          </Button>
        </>
      )}
      <BulkJobStatus control={bulk.job} />
    </>
  );
}

/**
 * The strip above a {@link DataTable}: with selection on, the selected count, "Delete selected"
 * and a running bulk job's progress; then the Refresh button when the page can re-run its query.
 */
export function DataTableToolbar({
  loading,
  onRefresh,
  bulk,
  selectionActions,
}: Readonly<DataTableToolbarProps>) {
  if (!onRefresh && !bulk) {
    return null;
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        mb: 0.5,
      }}
    >
      {bulk && <SelectionControls bulk={bulk} selectionActions={selectionActions} />}
      {onRefresh && (
        <TableRefreshButton
          disabled={loading}
          onRefresh={() => {
            onRefresh().catch((error: unknown) =>
              console.error('Could not refresh the table', error),
            );
          }}
        />
      )}
    </Box>
  );
}
