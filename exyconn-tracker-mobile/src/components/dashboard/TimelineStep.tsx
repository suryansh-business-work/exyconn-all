import type { ReactNode } from 'react';
import { XStack, YStack } from 'tamagui';
import type { TrackingStepState } from '@exyconn/tracker-core';
import { useBrand } from '../../theme/BrandProvider';
import { borderWidth, radius } from '../../theme/tokens';
import { Icon } from '../ui/Icon';
import { Body, Caption } from '../ui/Typography';

interface Props {
  /** 1-based position, drawn in the circle until the step is complete. */
  number: number;
  /** Already translated. */
  title: string;
  /** Already translated; null for none. */
  hint: string | null;
  state: TrackingStepState;
  /** The last step draws no line below its circle. */
  last: boolean;
  children: ReactNode;
}

/**
 * One step of the dashboard's vertical timeline — the phone's drawing of MUI's vertical Stepper
 * on the desktop: a numbered (or checked) circle, a line down to the next one, then the title,
 * its hint and the step's form. A locked step stays visible but cannot be touched or focused.
 */
export function TimelineStep({ number, title, hint, state, last, children }: Readonly<Props>) {
  const brand = useBrand();
  const locked = state === 'locked';
  const circle = locked ? '$muted' : brand.primary;
  const numberInk = locked ? '$muted' : brand.onPrimary;

  return (
    <XStack gap="$3">
      <YStack alignItems="center">
        <YStack
          width="$2"
          height="$2"
          borderRadius={radius.pill}
          borderWidth={borderWidth.hairline}
          borderColor={circle}
          backgroundColor={locked ? 'transparent' : brand.primary}
          alignItems="center"
          justifyContent="center"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {state === 'complete' ? (
            <Icon name="check" size={16} color={brand.onPrimary} />
          ) : (
            <Caption fontWeight="700" color={numberInk}>
              {number}
            </Caption>
          )}
        </YStack>
        {last ? null : (
          <YStack flex={1} width={borderWidth.thick} marginTop="$1" backgroundColor="$hairline" />
        )}
      </YStack>
      <YStack flex={1} minWidth={0} gap="$2" paddingBottom={last ? undefined : '$4'}>
        <YStack gap="$1">
          <Body fontWeight="600" color={locked ? '$muted' : '$ink'} accessibilityRole="header">
            {title}
          </Body>
          {hint === null ? null : <Caption>{hint}</Caption>}
        </YStack>
        <YStack
          opacity={locked ? 0.55 : 1}
          pointerEvents={locked ? 'none' : 'auto'}
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
        >
          {children}
        </YStack>
      </YStack>
    </XStack>
  );
}
