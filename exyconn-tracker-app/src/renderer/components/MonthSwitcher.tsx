import type { ReactElement } from 'react';
import { IconButton, Stack, Tooltip, Typography } from '@exyconn/ui';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { formatMonthLabel } from '../time';

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
}: Readonly<Props>): ReactElement {
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
