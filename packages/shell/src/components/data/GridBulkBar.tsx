import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, FormControlLabel, Switch, Typography } from '@/components/ui';
import { TableBulkAction } from '@/graphql/generated';
import { BulkJobStatus } from './BulkJobStatus';
import { useBulkRun } from './useBulkRun';
import type { TableBulk } from './useTableBulk';

interface BulkProps {
  bulk: TableBulk;
  /** True while the grid is loading a page — nothing here may start meanwhile. */
  loading: boolean;
}

/**
 * The toolbar's selection controls: "Select page" (ag-grid's header checkbox does not work
 * with a server-paged grid), for an archivable list the Archived switch, and the progress of a
 * bulk job while one runs.
 */
export function GridBulkControls({ bulk, loading }: Readonly<BulkProps>) {
  const t = useT();
  return (
    <>
      <Button
        size="small"
        startIcon={<LibraryAddCheckOutlinedIcon />}
        onClick={bulk.selectPage}
        disabled={loading}
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
              disabled={loading}
            />
          }
          label={t('Archived')}
        />
      )}
      <BulkJobStatus control={bulk.job} />
    </>
  );
}

type Translate = ReturnType<typeof useT>;
type FormatNumber = ReturnType<typeof useFormatters>['formatNumber'];

/** The bar's announced line: what is selected. */
function statusText(bulk: TableBulk, t: Translate, formatNumber: FormatNumber): string {
  const { matching } = bulk;
  if (bulk.allMatching && matching) {
    return t('All {count} matching rows are selected', { count: formatNumber(matching.total) });
  }
  if (bulk.selectedCount > 0) {
    return t('{count} selected', { count: bulk.selectedCount });
  }
  return '';
}

/**
 * While rows are selected: how many (announced politely), the offer to take every row the
 * current query matches rather than only the ticked ones, and what can be done to them. A bulk
 * job already running holds back only these buttons; the grid itself stays usable.
 */
export function GridBulkBar({ bulk, loading }: Readonly<BulkProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  const run = useBulkRun(bulk);
  const locked = loading || bulk.job.running;
  const hasSelection = bulk.selectedCount > 0;
  const total = bulk.matching?.total ?? 0;
  const offerAll =
    bulk.canSelectAll && hasSelection && !bulk.allMatching && total > bulk.selectedCount;
  const archiveAction = bulk.archived ? TableBulkAction.Restore : TableBulkAction.Archive;
  const archiveLabel = bulk.archived ? 'Restore selected' : 'Archive selected';
  const ArchiveIcon = bulk.archived ? UnarchiveOutlinedIcon : ArchiveOutlinedIcon;
  return (
    <Box
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
        {statusText(bulk, t, formatNumber)}
      </Typography>
      {offerAll && (
        <Button
          size="small"
          startIcon={<SelectAllIcon />}
          onClick={bulk.selectAllMatching}
          disabled={locked}
        >
          {t('Select all {count} matching', { count: formatNumber(total) })}
        </Button>
      )}
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
          disabled={loading}
        >
          {t('Clear selection')}
        </Button>
      )}
    </Box>
  );
}
