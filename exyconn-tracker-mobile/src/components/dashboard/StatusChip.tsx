import { XStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { TrackerStatus } from '@exyconn/tracker-core';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { useThemeColor, type ThemeColor } from '../../theme/useThemeColor';
import { TrackingPulse } from '../shell/TrackingPulse';
import { Caption } from '../ui/Typography';

interface StatusMeta {
  label: string;
  tone: ThemeColor;
}

const STATUS_META: Readonly<Record<TrackerStatus, StatusMeta>> = {
  'signed-out': { label: 'Signed out', tone: 'muted' },
  'consent-required': { label: 'Consent required', tone: 'muted' },
  idle: { label: 'Not tracking', tone: 'muted' },
  tracking: { label: 'Tracking…', tone: 'success' },
  paused: { label: 'Paused', tone: 'warning' },
};

interface Props {
  status: TrackerStatus;
}

/** Status pill with the dot that breathes only while tracking is actually running. */
export function StatusChip({ status }: Readonly<Props>) {
  const t = useT();
  const meta = STATUS_META[status];
  const color = useThemeColor(meta.tone);
  const label = t(meta.label);

  return (
    <XStack
      borderWidth={1}
      borderColor={color}
      borderRadius={TRACKER_RADIUS}
      paddingLeft="$1"
      paddingRight="$2.5"
      alignItems="center"
      flexShrink={0}
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('Status: {status}', { status: label })}
    >
      <TrackingPulse status={status} />
      <Caption color="$ink" fontWeight="600">
        {label}
      </Caption>
    </XStack>
  );
}
