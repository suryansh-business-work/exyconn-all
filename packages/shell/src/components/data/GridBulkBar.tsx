import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import { useT } from '@exyconn/i18n';
import { Box, Button, FormControlLabel, Switch, Typography } from '@/components/ui';
import { TableBulkAction } from '@/graphql/generated';
import { useBulkRun } from './useBulkRun';
import type { TableBulk } from './useTableBulk';

interface BulkProps {
  bulk: TableBulk;
  /** True while the grid is loading a page — nothing here may start meanwhile. */
  loading: boolean;
}

/**
 * The toolbar's selection controls: "Select page" (ag-grid's header checkbox does not work
 * with a server-paged grid) and, for an archivable list, the Archived switch.
 */
export function GridBulkControls({ bulk, loading }: Readonly<BulkProps>) {
  const t = useT();
  const locked = loading || bulk.busy;
  return (
    <>
      <Button
        size="small"
        startIcon={<LibraryAddCheckOutlinedIcon />}
        onClick={bulk.selectPage}
        disabled={locked}
      >
        {t('Select page')}
      </Button>
      {bulk.archivable && (
        <FormControlLabel
          sx={{ ml: 0 }}
          control={
            <Switch
              size="small"
              checked={bulk.archived}
              onChange={(event) => bulk.setArchived(event.target.checked)}
              disabled={locked}
            />
          }
          label={t('Archived')}
        />
      )}
    </>
  );
}

/** While rows are selected: how many (announced politely), and what can be done to them. */
export function GridBulkBar({ bulk, loading }: Readonly<BulkProps>) {
  const t = useT();
  const run = useBulkRun(bulk);
  const locked = loading || bulk.busy;
  const hasSelection = bulk.selectedCount > 0;
  const archiveAction = bulk.archived ? TableBulkAction.Restore : TableBulkAction.Archive;
  const archiveLabel = bulk.archived ? 'Restore selected' : 'Archive selected';
  const ArchiveIcon = bulk.archived ? UnarchiveOutlinedIcon : ArchiveOutlinedIcon;
  return (
    <Box
      aria-busy={bulk.busy}
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        mb: hasSelection ? 1.5 : 0,
      }}
    >
      {/* Always mounted, so a screen reader hears the count change rather than a new region. */}
      <Typography variant="body2" role="status" aria-live="polite" sx={{ mr: 1 }}>
        {hasSelection ? t('{count} selected', { count: bulk.selectedCount }) : ''}
      </Typography>
      {hasSelection && bulk.deletable && (
        <Button
          size="small"
          color="error"
          variant="outlined"
          startIcon={<DeleteOutlineIcon />}
          onClick={() => run(TableBulkAction.Delete)}
          disabled={locked}
        >
          {t('Delete selected')}
        </Button>
      )}
      {hasSelection && bulk.archivable && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArchiveIcon />}
          onClick={() => run(archiveAction)}
          disabled={locked}
        >
          {t(archiveLabel)}
        </Button>
      )}
      {hasSelection && (
        <Button
          size="small"
          startIcon={<ClearIcon />}
          onClick={bulk.clearSelection}
          disabled={locked}
        >
          {t('Clear selection')}
        </Button>
      )}
    </Box>
  );
}
