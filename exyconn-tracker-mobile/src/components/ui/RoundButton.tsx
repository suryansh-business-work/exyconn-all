import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { YStack } from 'tamagui';
import { borderWidth } from '../../theme/tokens';

/** The size of the header's round buttons. */
export const ROUND_BUTTON_SIZE = 44;

interface Props {
  label: string;
  onPress: () => void;
  /** A raw fill (the brand accent for the avatar); paper otherwise. */
  fill?: string;
  children: ReactNode;
}

/** A round paper button beside the page title — the desktop header's, on the phone. */
export function RoundButton({ label, onPress, fill, children }: Readonly<Props>) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <YStack
        width={ROUND_BUTTON_SIZE}
        height={ROUND_BUTTON_SIZE}
        borderRadius={ROUND_BUTTON_SIZE / 2}
        alignItems="center"
        justifyContent="center"
        backgroundColor={fill ?? '$paper'}
        borderWidth={fill === undefined ? borderWidth.hairline : 0}
        borderColor="$hairline"
      >
        {children}
      </YStack>
    </Pressable>
  );
}
