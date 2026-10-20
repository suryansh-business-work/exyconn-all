import { useRef, useState } from 'react';
import type { HostInstance } from 'react-native';
import { Spinner, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { locationPinLine, type TrackerLocationPin } from '@exyconn/tracker-core';
import { useTodayLocations } from '../../hooks/useTodayLocations';
import { LocationMapSheet } from '../location/LocationMapSheet';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';
import { LocationRow } from './LocationRow';

interface Props {
  timezone: string;
  attendanceMarked: boolean;
  tracking: boolean;
}

interface BodyProps {
  pins: readonly TrackerLocationPin[];
  loading: boolean;
  timezone: string;
  onOpen: (pin: TrackerLocationPin, opener: HostInstance | null) => void;
}

/** The list itself, or what stands in for it: a spinner, or "none yet". */
function LocationsBody({ pins, loading, timezone, onOpen }: Readonly<BodyProps>) {
  const t = useT();
  if (loading) {
    return <Spinner size="small" accessibilityLabel={t('Loading today’s locations')} />;
  }
  if (pins.length === 0) {
    return <Caption>{t('No locations recorded today.')}</Caption>;
  }
  return (
    <YStack>
      {pins.map((pin) => (
        <LocationRow key={pin.id} pin={pin} timezone={timezone} onOpen={onOpen} />
      ))}
    </YStack>
  );
}

/** Where today's work was recorded from: the attendance pin, then each move while tracking. */
export function TodayLocations({ timezone, attendanceMarked, tracking }: Readonly<Props>) {
  const t = useT();
  const { pins, loading, failed } = useTodayLocations(timezone, attendanceMarked, tracking);
  const error = failed ? t('Could not load today’s locations.') : null;
  const [open, setOpen] = useState<TrackerLocationPin | null>(null);
  const opener = useRef<HostInstance>(null);

  return (
    <Surface padding="$4">
      <Heading>{t('Today’s locations')}</Heading>
      <Caption>
        {t('Where you marked attendance, and each place you moved to while tracking.')}
      </Caption>
      {error === null ? null : <Notice severity="warning">{error}</Notice>}
      <LocationsBody
        pins={pins}
        loading={loading}
        timezone={timezone}
        onOpen={(pin, node) => {
          opener.current = node;
          setOpen(pin);
        }}
      />
      <LocationMapSheet
        pin={open}
        description={open === null ? '' : locationPinLine(open, timezone, t)}
        onClose={() => setOpen(null)}
        returnFocusTo={opener}
      />
    </Surface>
  );
}
