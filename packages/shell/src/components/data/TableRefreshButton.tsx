import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Tooltip } from '@/components/ui';

interface TableRefreshButtonProps {
  onRefresh: () => void;
  /** True while the table is loading — a second reload cannot be queued behind the first. */
  disabled: boolean;
}

/** The reload control every table puts beside its data. */
export function TableRefreshButton({ onRefresh, disabled }: Readonly<TableRefreshButtonProps>) {
  return (
    <Tooltip title="Refresh">
      {/* A disabled button fires no pointer events, so the tooltip needs a wrapper to hang on. */}
      <span>
        <IconButton size="small" onClick={onRefresh} disabled={disabled} aria-label="Refresh table">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );
}
