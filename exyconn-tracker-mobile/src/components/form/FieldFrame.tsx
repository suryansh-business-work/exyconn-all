import type { ReactNode } from 'react';
import { Label, YStack } from 'tamagui';
import { Caption } from '../ui/Typography';

interface Props {
  /** Ties the label to its control for screen readers. */
  id: string;
  label: string;
  /** What to type, shown until there is an error to show instead. */
  hint?: string;
  error?: string;
  children: ReactNode;
}

/**
 * Label, control, then either the hint or the error — never both, so a field says one thing at
 * a time. Every form field in the app is built on this.
 */
export function FieldFrame({ id, label, hint, error, children }: Readonly<Props>) {
  const help = error ?? hint;
  return (
    <YStack gap="$1.5">
      <Label htmlFor={id} size="$3" color="$ink" fontWeight="600">
        {label}
      </Label>
      {children}
      {help === undefined ? null : (
        <Caption color={error === undefined ? '$muted' : '$error'} accessibilityLiveRegion="polite">
          {help}
        </Caption>
      )}
    </YStack>
  );
}
