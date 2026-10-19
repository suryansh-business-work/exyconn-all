import type { RefObject } from 'react';
import { Modal, type HostInstance } from 'react-native';
import { WebView } from 'react-native-webview';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { mapEmbedUrl, type TrackerLocationInput } from '@exyconn/tracker-core';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { SCRIM } from '../../theme/palette';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Caption, Heading } from '../ui/Typography';

const MAP_HEIGHT = 260;

type Pin = Pick<TrackerLocationInput, 'lat' | 'lng' | 'accuracyM'>;

interface Props {
  /** The fix on show; the sheet is closed while this is null. */
  pin: Pin | null;
  /** Already translated; the sentence under the title. */
  description: string;
  onClose: () => void;
  /** Given, the sheet asks to confirm the pin (marking attendance); absent, it only shows it. */
  onConfirm?: () => void;
  busy?: boolean;
  error?: string | null;
  /** The control that opened the sheet; the screen reader goes back to it on close. */
  returnFocusTo: RefObject<HostInstance | null>;
}

/**
 * A location fix on a Google Map, with how far off it may be. Shown before attendance is
 * marked (confirm or cancel), and when a pin from today's list is tapped (view only).
 */
export function LocationMapSheet({
  pin,
  description,
  onClose,
  onConfirm,
  busy = false,
  error = null,
  returnFocusTo,
}: Readonly<Props>) {
  const t = useT();
  const reduceMotion = useReduceMotion();
  const open = pin !== null;
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  const closeLabel = onConfirm === undefined ? t('Close') : t('Cancel');

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      {...modalProps}
    >
      <YStack flex={1} justifyContent="flex-end" backgroundColor={SCRIM}>
        <Surface padding="$5" gap="$4" accessibilityViewIsModal>
          <Heading ref={titleRef}>{t('Your location')}</Heading>
          <Body>{description}</Body>
          {pin === null ? null : (
            <YStack
              height={MAP_HEIGHT}
              borderRadius={TRACKER_RADIUS}
              overflow="hidden"
              accessible
              accessibilityRole="image"
              accessibilityLabel={t('Your location')}
            >
              <WebView source={{ uri: mapEmbedUrl(pin) }} style={{ flex: 1 }} />
            </YStack>
          )}
          {pin === null ? null : (
            <Caption>
              {t('Accuracy about {metres} m', { metres: Math.round(pin.accuracyM) })}
            </Caption>
          )}
          {error === null ? null : <Notice severity="error">{error}</Notice>}
          <XStack gap="$3" justifyContent="flex-end" flexWrap="wrap">
            <AppButton label={closeLabel} tone="text" onPress={onClose} disabled={busy} />
            {onConfirm === undefined ? null : (
              <AppButton
                label={t('Confirm & mark attendance')}
                icon="account-check-outline"
                onPress={onConfirm}
                busy={busy}
              />
            )}
          </XStack>
        </Surface>
      </YStack>
    </Modal>
  );
}
