import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  Alert,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import HowToRegOutlined from '@mui/icons-material/HowToRegOutlined';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import { locationPinLine, locationPinParts } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';
import type { TrackerLocationPin } from '@shared/types';
import useTodayLocations from '../hooks/useTodayLocations';
import { useAnnounce } from '../a11y/LiveAnnouncer';
import LocationMapDialog from './LocationMapDialog';
import Surface from './Surface';

interface Props {
  timezone: string;
  /** While tracking, the list is re-read on the move check's five-minute beat. */
  tracking: boolean;
  /** Marking attendance sends the day's first pin, so the list is re-read when it flips. */
  attendanceMarked: boolean;
}

interface PinRowProps {
  pin: TrackerLocationPin;
  timezone: string;
  onOpen: (pin: TrackerLocationPin) => void;
}

/** One pin: what it was, when, and from which source. Opens it on the map. */
function PinRow({ pin, timezone, onOpen }: Readonly<PinRowProps>): ReactElement {
  const t = useT();
  const Icon = pin.kind === 'ATTENDANCE' ? HowToRegOutlined : PlaceOutlined;
  const parts = locationPinParts(pin, timezone, t);
  return (
    <ListItemButton
      onClick={() => onOpen(pin)}
      aria-label={t('{time} · {kind} · {source}, show on map', { ...parts })}
      sx={{ borderRadius: `${TRACKER_RADIUS}px` }}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={locationPinLine(pin, timezone, t)} />
    </ListItemButton>
  );
}

/**
 * Where the employee has been today: the attendance pin, then each place they moved to while
 * tracking. Any pin opens on the map, view-only.
 */
export default function TodayLocationsCard({
  timezone,
  tracking,
  attendanceMarked,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const { data: pins, loading, failed } = useTodayLocations(timezone, tracking, attendanceMarked);
  const [open, setOpen] = useState<TrackerLocationPin | null>(null);
  const error = failed ? t('Could not load today’s locations.') : null;
  useAnnounce(error);

  let body: ReactElement;
  if (loading) {
    body = (
      <Skeleton
        variant="rounded"
        height={56}
        role="progressbar"
        aria-label={t('Loading today’s locations')}
      />
    );
  } else if (pins === null || pins.length === 0) {
    body = (
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {t('No locations recorded today.')}
      </Typography>
    );
  } else {
    body = (
      <List dense disablePadding>
        {pins.map((pin) => (
          <PinRow key={pin.id} pin={pin} timezone={timezone} onOpen={setOpen} />
        ))}
      </List>
    );
  }

  return (
    <Surface sx={{ p: 2.5 }}>
      <Stack spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" component="h2">
            {t('Today’s locations')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('Where you marked attendance, and each place you moved to while tracking.')}
          </Typography>
        </Stack>
        {error === null ? null : (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
            {error}
          </Alert>
        )}
        {body}
      </Stack>
      <LocationMapDialog
        location={open}
        title={t('Your location')}
        description={open === null ? '' : locationPinLine(open, timezone, t)}
        onClose={() => setOpen(null)}
      />
    </Surface>
  );
}
