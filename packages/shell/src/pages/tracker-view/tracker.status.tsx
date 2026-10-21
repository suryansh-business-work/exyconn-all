import type { ReactElement } from 'react';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlineOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import RedeemIcon from '@mui/icons-material/Redeem';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkHistoryOutlinedIcon from '@mui/icons-material/WorkHistoryOutlined';
import { TRACKER_STATUS_TINT_ALPHA, trackerDayStatus, useTheme } from '@/components/ui';
import type { TrackerDayMark } from './tracker.types';

/** The icon each status carries beside its colour, so it never rests on colour alone. */
export const STATUS_ICONS: Readonly<Record<TrackerDayMark, ReactElement>> = {
  COMPLETED: <WorkOutlineIcon fontSize="inherit" />,
  SHORT: <PriorityHighIcon fontSize="inherit" />,
  LEAVE: <FlightTakeoffIcon fontSize="inherit" />,
  HOLIDAY: <RedeemIcon fontSize="inherit" />,
  WEEK_OFF: <EventBusyIcon fontSize="inherit" />,
  OFF_COMPUTER: <WorkHistoryOutlinedIcon fontSize="inherit" />,
};

/** A status's hue and its tile tint in the current colour mode — the trackers' shared tokens. */
export function useStatusColors() {
  const mode = useTheme().palette.mode;
  const hues = trackerDayStatus[mode];
  return (mark: TrackerDayMark) => ({
    hue: hues[mark],
    tint: `${hues[mark]}${TRACKER_STATUS_TINT_ALPHA}`,
  });
}
