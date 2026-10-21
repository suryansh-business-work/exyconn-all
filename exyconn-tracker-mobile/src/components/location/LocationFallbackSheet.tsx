import type { RefObject } from 'react';
import { Modal, type HostInstance } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import {
  locationFailureDetail,
  locationFailureText,
  type AttendanceLocationFallback,
} from '@exyconn/tracker-core';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { SCRIM } from '../../theme/palette';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Caption, Heading } from '../ui/Typography';
import { OpenLocationSettingsButton } from './OpenLocationSettingsButton';

interface Props {
  /** The location error's message; null keeps the sheet closed. */
  failure: string | null;
  /** The address on the employee's record; null when HR has not added one. */
  profileAddress: string | null;
  /** Which fallback is being sent, for its spinner; null when none is. */
  marking: AttendanceLocationFallback | null;
  /** Why the last mark failed, already in words; null when it has not. */
  error: string | null;
  onRetry: () => void;
  onFallback: (fallback: AttendanceLocationFallback) => void;
  onClose: () => void;
  /** The control that opened the sheet; the screen reader goes back to it on close. */
  returnFocusTo: RefObject<HostInstance | null>;
}

/**
 * Shown when no location could be read for attendance — the desktop's LocationFallbackDialog,
 * redrawn for the phone. Says why, in a sentence and in the platform's own words, and never
 * leaves the employee stuck: try again, fix the setting, mark in at the address on their
 * employee record, or mark in without a location.
 */
export function LocationFallbackSheet({
  failure,
  profileAddress,
  marking,
  error,
  onRetry,
  onFallback,
  onClose,
  returnFocusTo,
}: Readonly<Props>) {
  const t = useT();
  const reduceMotion = useReduceMotion();
  const open = failure !== null;
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  const busy = marking !== null;
  const reason = failure === null ? '' : locationFailureText(failure, t);
  const detail = failure === null ? '' : locationFailureDetail(failure);

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
          <Heading ref={titleRef}>{t('Your location could not be read')}</Heading>
          <Notice
            severity="warning"
            detail={detail === '' ? undefined : t('Details: {detail}', { detail })}
          >
            {reason}
          </Notice>
          <Body>{t('You can still mark your attendance without a device location.')}</Body>
          <YStack gap="$1">
            <AppButton
              label={t('Mark in at my profile address')}
              icon="home-map-marker"
              tone="outlined"
              full
              busy={marking === 'PROFILE_ADDRESS'}
              disabled={busy || profileAddress === null}
              onPress={() => onFallback('PROFILE_ADDRESS')}
            />
            <Caption>
              {profileAddress ??
                t('There is no address on your employee record. Ask HR to add one.')}
            </Caption>
          </YStack>
          <YStack gap="$1">
            <AppButton
              label={t('Mark in without location')}
              icon="map-marker-off-outline"
              tone="outlined"
              full
              busy={marking === 'NONE'}
              disabled={busy}
              onPress={() => onFallback('NONE')}
            />
            <Caption>
              {t('HR will see that this attendance was marked without a location.')}
            </Caption>
          </YStack>
          {error === null ? null : <Notice severity="error">{error}</Notice>}
          <OpenLocationSettingsButton />
          <XStack gap="$3" justifyContent="flex-end" flexWrap="wrap">
            <AppButton label={t('Cancel')} tone="text" onPress={onClose} disabled={busy} />
            <AppButton label={t('Try again')} icon="refresh" onPress={onRetry} disabled={busy} />
          </XStack>
        </Surface>
      </YStack>
    </Modal>
  );
}
