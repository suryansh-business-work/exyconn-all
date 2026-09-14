import { SCRIM } from '../../theme/palette';
import type { RefObject } from 'react';
import { Modal, type HostInstance } from 'react-native';
import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { AppButton } from './AppButton';
import { Surface } from './Surface';
import { Body, Heading } from './Typography';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** A destructive confirmation (sign out, withdraw) reads in the error colour. */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** The control that asked; the screen reader goes back to it when the dialog closes. */
  returnFocusTo: RefObject<HostInstance | null>;
}

/**
 * The app's confirmation — never the OS `Alert.alert` (CLAUDE.md rule 12), so it carries the
 * brand, the theme and the same wording rules as every other surface.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
  returnFocusTo,
}: Readonly<Props>) {
  const t = useT();
  const reduceMotion = useReduceMotion();
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onCancel}
      {...modalProps}
    >
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor={SCRIM}>
        <Surface padding="$5" gap="$4" accessibilityViewIsModal>
          <Heading ref={titleRef}>{title}</Heading>
          <Body color="$muted">{message}</Body>
          <XStack gap="$3" justifyContent="flex-end">
            <AppButton label={t('Cancel')} tone="text" onPress={onCancel} disabled={busy} />
            <AppButton label={confirmLabel} onPress={onConfirm} danger={danger} busy={busy} />
          </XStack>
        </Surface>
      </YStack>
    </Modal>
  );
}
