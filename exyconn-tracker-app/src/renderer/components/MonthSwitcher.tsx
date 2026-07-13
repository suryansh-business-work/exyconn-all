import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { formatMonthLabel } from '../format';

interface Props {
  month: Date;
  canGoForward: boolean;
  onChange: (month: Date) => void;
}

function shift(month: Date, months: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + months, 1);
}

/** Prev / next month navigation with the month label between them. */
export default function MonthSwitcher({
  month,
  canGoForward,
  onChange,
}: Readonly<Props>): JSX.Element {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title="Previous month">
        <IconButton
          size="small"
          color="inherit"
          aria-label="Previous month"
          onClick={() => onChange(shift(month, -1))}
        >
          <ChevronLeftRounded />
        </IconButton>
      </Tooltip>
      <Typography variant="subtitle1" sx={{ minWidth: 148, textAlign: 'center', fontWeight: 700 }}>
        {formatMonthLabel(month)}
      </Typography>
      <Tooltip title="Next month">
        <span>
          <IconButton
            size="small"
            color="inherit"
            aria-label="Next month"
            disabled={!canGoForward}
            onClick={() => onChange(shift(month, 1))}
          >
            <ChevronRightRounded />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
