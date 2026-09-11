import { Switch, XStack, YStack } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { tracker } from '../../tracker/instance';
import { SegmentedControl, type SegmentOption } from '../ui/SegmentedControl';
import { Body, Caption } from '../ui/Typography';

/** How much of the plain ground stays painted over the gradient — the desktop's slider, in steps. */
const OPACITY: readonly SegmentOption<string>[] = [
  { value: '0.3', label: '30%' },
  { value: '0.45', label: '45%' },
  { value: '0.6', label: '60%' },
  { value: '0.75', label: '75%' },
  { value: '0.9', label: '90%' },
];

interface Props {
  transparent: boolean;
  opacity: number;
}

/**
 * The transparent background: the ground behind the cards turns to the workspace's brand
 * gradient, as the desktop's window turns see-through. Cards stay solid, so text keeps its
 * contrast; the opacity says how much of the plain ground is left over the gradient.
 */
export function TransparencyPreference({ transparent, opacity }: Readonly<Props>) {
  const brand = useBrand();
  return (
    <YStack gap="$2">
      <XStack gap="$3" alignItems="flex-start">
        <YStack flex={1} gap="$1">
          <Body fontWeight="600">Transparent background</Body>
          <Caption>
            {transparent
              ? 'Your workspace’s colours show through behind the cards.'
              : 'The background is painted solid.'}
          </Caption>
        </YStack>
        <Switch
          native="mobile"
          checked={transparent}
          onCheckedChange={(next) => tracker.setPreferences({ transparentBackground: next })}
          nativeProps={{
            trackColor: { true: brand.primary },
            accessibilityLabel: 'Transparent background',
            accessibilityState: { checked: transparent },
          }}
        />
      </XStack>
      {transparent ? (
        <SegmentedControl
          kind="choice"
          full
          label="Background opacity"
          options={OPACITY}
          value={String(opacity)}
          onChange={(next) => tracker.setPreferences({ backgroundOpacity: Number(next) })}
        />
      ) : null}
    </YStack>
  );
}
