import { Image } from 'expo-image';
import { Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme, YStack } from 'tamagui';
import { formatDateTime, type DayScreenshot } from '@exyconn/tracker-core';
import { stepIndex } from '../../lib/screenshots/gallery-day';
import { LightboxNav, LightboxTopBar } from './LightboxBars';

interface Props {
  shots: readonly DayScreenshot[];
  /** Index into `shots` of the one on screen, or `null` when the lightbox is closed. */
  index: number | null;
  timezone: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * One screenshot, full screen.
 *
 * A thumbnail is enough to know a shot exists and nowhere near enough to see what it actually
 * caught. An employee reviewing a photograph of their own screen — which their manager will read
 * at full size — is owed the same view of it. Drawn on the dark chrome whatever the app's theme,
 * as any image viewer is; Android's back gesture closes it.
 */
export function ScreenshotLightbox({
  shots,
  index,
  timezone,
  onClose,
  onNavigate,
}: Readonly<Props>) {
  const insets = useSafeAreaInsets();
  const shot = index === null ? undefined : shots[index];

  if (index === null || shot === undefined) {
    return null;
  }

  const capturedAt = formatDateTime(shot.capturedAt, timezone);
  const step = (delta: number): void => onNavigate(stepIndex(index, delta, shots.length));

  return (
    <Modal
      visible
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <Theme name="dark">
        <YStack
          flex={1}
          backgroundColor="$app"
          paddingTop={insets.top}
          paddingBottom={insets.bottom}
          accessibilityViewIsModal
          accessibilityLabel="Screenshot, full screen"
        >
          <LightboxTopBar
            capturedAt={capturedAt}
            activityPercent={shot.activityPercent}
            blurred={shot.blurred}
            onClose={onClose}
          />
          <YStack flex={1} padding="$2">
            <Image
              source={{ uri: shot.imageUrl }}
              contentFit="contain"
              recyclingKey={shot.id}
              accessibilityLabel={`Screenshot captured at ${capturedAt}, full screen`}
              style={{ flex: 1 }}
            />
          </YStack>
          {shots.length > 1 ? (
            <LightboxNav index={index} total={shots.length} onStep={step} />
          ) : null}
        </YStack>
      </Theme>
    </Modal>
  );
}
