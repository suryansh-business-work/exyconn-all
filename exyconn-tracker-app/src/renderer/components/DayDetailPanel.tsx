import type { ReactElement } from 'react';
import { Alert, Button, Skeleton, Stack, Typography } from '@exyconn/ui';
import OpenInNewRounded from '@mui/icons-material/OpenInNewRounded';
import type { DayDetail } from '@shared/types';
import { activityPercent, formatCount } from '../format';
import { dayBounds, formatDayLabel } from '../time';
import { run } from '../run';
import Surface from './Surface';
import ReportTotals from './ReportTotals';
import ScreenshotGrid from './ScreenshotGrid';

interface Props {
  date: Date;
  detail: DayDetail | null;
  loading: boolean;
  error: string | null;
  timezone: string;
}

const SKELETON_TILES = ['t1', 't2', 't3', 't4'] as const;

/** Counts only — the tracker records how much you typed, never what you typed. */
function inputSummary(detail: DayDetail): string {
  const keys = formatCount(detail.keyCount);
  const clicks = formatCount(detail.mouseCount);
  const sessions = formatCount(detail.sessions);
  return `${keys} keys · ${clicks} clicks · ${sessions} sessions`;
}

/** The selected day: its totals, then that day's screenshots — which open in their own window. */
export default function DayDetailPanel({
  date,
  detail,
  loading,
  error,
  timezone,
}: Readonly<Props>): ReactElement {
  const heading = (
    <Typography variant="subtitle1" fontWeight={700}>
      {formatDayLabel(date)}
    </Typography>
  );

  // The gallery is a separate window that loads its own data, so it is handed the same bounds
  // this panel used — the day as it runs in the EMPLOYEE'S zone, not this computer's.
  const openGallery = (): void => {
    run(() => window.tracker.openScreenshots(dayBounds(date, timezone)));
  };

  if (error !== null) {
    return (
      <Stack spacing={1}>
        {heading}
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px' }}>
          {error}
        </Alert>
      </Stack>
    );
  }

  if (loading || detail === null) {
    return (
      <Stack spacing={1}>
        {heading}
        <Skeleton variant="rounded" height={72} />
        <Surface sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          {SKELETON_TILES.map((id) => (
            <Skeleton key={id} variant="rounded" height={96} />
          ))}
        </Surface>
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      {heading}

      <ReportTotals
        totals={{
          activeMs: detail.activeMs,
          idleMs: detail.idleMs,
          activityPercent: activityPercent(detail.activeMs, detail.idleMs),
        }}
      />

      <Typography variant="caption" color="text.secondary">
        {inputSummary(detail)}
      </Typography>

      <Surface sx={{ p: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle2">
            Screenshots ({formatCount(detail.screenshots.length)})
          </Typography>
          {detail.screenshots.length > 0 ? (
            <Button size="small" startIcon={<OpenInNewRounded />} onClick={openGallery}>
              Open gallery
            </Button>
          ) : null}
        </Stack>

        <ScreenshotGrid shots={detail.screenshots} timezone={timezone} onOpen={openGallery} />
      </Surface>
    </Stack>
  );
}
