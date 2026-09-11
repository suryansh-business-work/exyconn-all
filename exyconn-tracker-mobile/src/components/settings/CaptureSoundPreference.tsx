import { Switch, XStack, YStack } from 'tamagui';
import type { TrackerSettings } from '@exyconn/tracker-core';
import { captureSoundCaption, captureSoundLocked } from '../../lib/settings/capture-sound';
import { useBrand } from '../../theme/BrandProvider';
import { tracker } from '../../tracker/instance';
import { capabilities } from '../../tracker/platform';
import { Body, Caption } from '../ui/Typography';

interface Props {
  muted: boolean;
  /** Null until the portal has answered; the workspace's own mute lives here. */
  settings: TrackerSettings | null;
}

/**
 * Mutes the capture sound on THIS phone.
 *
 * Being on a call next to a tracker firing a shutter every few minutes should not need an
 * administrator to fix, so this is the employee's own switch. It silences and nothing more: the
 * capture notification still appears on every capture (the shutter IS that notification's sound),
 * so muting can never become a way of being screenshotted without knowing.
 */
export function CaptureSoundPreference({ muted, settings }: Readonly<Props>) {
  const brand = useBrand();
  const input = {
    canCapture: capabilities.screenshots,
    mutedByWorkspace: settings !== null && !settings.captureSoundEnabled,
    muted,
  };
  const locked = captureSoundLocked(input);

  return (
    <XStack gap="$3" alignItems="flex-start">
      <YStack flex={1} gap="$1">
        <Body fontWeight="600">Mute the screenshot sound</Body>
        <Caption>{captureSoundCaption(input)}</Caption>
      </YStack>
      <Switch
        native="mobile"
        checked={muted}
        disabled={locked}
        onCheckedChange={(next) => tracker.setPreferences({ muteCaptureSound: next })}
        nativeProps={{
          disabled: locked,
          trackColor: { true: brand.primary },
          accessibilityLabel: 'Mute the screenshot sound on this phone',
          accessibilityState: { checked: muted, disabled: locked },
        }}
      />
    </XStack>
  );
}
