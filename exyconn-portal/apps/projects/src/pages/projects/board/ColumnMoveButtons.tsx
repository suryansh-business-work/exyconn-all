import { useT } from '@exyconn/i18n';
import { IconButton } from '@exyconn/shell/components/ui';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface ColumnMoveButtonsProps {
  index: number;
  columnCount: number;
  onMove: (toIndex: number) => void;
}

/** Moves a column one place left or right — the single-click alternative to dragging it. */
export function ColumnMoveButtons({
  index,
  columnCount,
  onMove,
}: Readonly<ColumnMoveButtonsProps>) {
  const t = useT();
  return (
    <>
      <IconButton
        size="small"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        aria-label={t('Move column left')}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        disabled={index === columnCount - 1}
        onClick={() => onMove(index + 1)}
        aria-label={t('Move column right')}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </>
  );
}
