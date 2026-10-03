import { Image } from 'expo-image';
import { useState, type RefObject } from 'react';
import { Modal, type HostInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Theme, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { formatDateTime, type DayScreenshot } from '@exyconn/tracker-core';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { stepIndex } from '../../lib/screenshots/gallery-day';
import { LightboxNav, LightboxTopBar } from './LightboxBars';

interface Props {
  shots: readonly DayScreenshot[];
  /** Index into `shots` of the one on screen (kept while closing), or `null` before any is opened. */
  index: number | null;
  open: boolean;
  timezone: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
  /** The thumbnail that was tapped; the screen reader goes back to it on close. */
  returnFocusTo: RefObject<HostInstance | null>;
}

/** The full-size image, with a spinner over it until it has arrived from storage. */
function LightboxImage({ uri, label }: Readonly<{ uri: string; label: string }>) {
  const t = useT();
  const [loading, setLoading] = useState(true);
  return (
    <YStack flex={1} padding="$2">
      <Image
        source={{ uri }}
        contentFit="contain"
        accessibilityLabel={label}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
        style={{ flex: 1 }}
      />
      {loading ? (
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
        >
          <Spinner size="large" color="$ink" accessibilityLabel={t('Loading the screenshot')} />
        </YStack>
      ) : null}
    </YStack>
  );
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
  open,
  timezone,
  onClose,
  onNavigate,
  returnFocusTo,
}: Readonly<Props>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  const shot = index === null ? undefined : shots[index];

  if (index === null || shot === undefined) {
    return null;
  }

  const capturedAt = formatDateTime(shot.capturedAt, timezone);
  const step = (delta: number): void => onNavigate(stepIndex(index, delta, shots.length));

  return (
    <Modal
      visible={open}
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      {...modalProps}
    >
      <Theme name="dark">
        <YStack
          flex={1}
          backgroundColor="$app"
          paddingTop={insets.top}
          paddingBottom={insets.bottom}
          accessibilityViewIsModal
          accessibilityLabel={t('Screenshot, full screen')}
        >
          <LightboxTopBar
            titleRef={titleRef}
            capturedAt={capturedAt}
            activityPercent={shot.activityPercent}
            blurred={shot.blurred}
            onClose={onClose}
          />
          <LightboxImage
            key={shot.id}
            uri={shot.imageUrl}
            label={t('Screenshot captured at {time}, full screen', { time: capturedAt })}
          />
          {shots.length > 1 ? (
            <LightboxNav index={index} total={shots.length} onStep={step} />
          ) : null}
        </YStack>
      </Theme>
    </Modal>
  );
}
