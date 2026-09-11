import { SCRIM } from '../../theme/palette';
import { Modal } from 'react-native';
import { XStack, YStack } from 'tamagui';
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
}: Readonly<Props>) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor={SCRIM}>
        <Surface padding="$5" gap="$4" accessibilityViewIsModal>
          <Heading>{title}</Heading>
          <Body color="$muted">{message}</Body>
          <XStack gap="$3" justifyContent="flex-end">
            <AppButton label="Cancel" tone="text" onPress={onCancel} disabled={busy} />
            <AppButton label={confirmLabel} onPress={onConfirm} danger={danger} busy={busy} />
          </XStack>
        </Surface>
      </YStack>
    </Modal>
  );
}
