import { XStack, YStack } from 'tamagui';
import type { ChangeLabel } from '@exyconn/tracker-core';
import { useBrand } from '../../../theme/BrandProvider';
import { Icon, type IconName } from '../../ui/Icon';
import { Surface } from '../../ui/Surface';
import { Body, Caption, Title } from '../../ui/Typography';
import { ChangeBadge } from './ChangeBadge';

/** The icon's tint: the brand accent at this alpha (two hex digits). */
const ICON_TINT = '1f';
const ICON_SIZE = 30;

interface Props {
  label: string;
  value: string;
  /** Against the period before; null when that period had nothing to compare. */
  change: ChangeLabel | null;
  /** The earlier period's figure, in words — "412 the 7 days before". */
  caption: string;
  icon: IconName;
}

/** One figure for the period: its name and icon, the number, and how it moved. */
export function MetricCard({ label, value, change, caption, icon }: Readonly<Props>) {
  const brand = useBrand();
  return (
    <Surface flex={1} padding="$3" gap="$2">
      <XStack alignItems="center" justifyContent="space-between" gap="$2">
        <Body fontWeight="600" flex={1} numberOfLines={1}>
          {label}
        </Body>
        <YStack
          width={ICON_SIZE}
          height={ICON_SIZE}
          borderRadius={ICON_SIZE / 2}
          alignItems="center"
          justifyContent="center"
          backgroundColor={`${brand.primary}${ICON_TINT}`}
        >
          <Icon name={icon} size={18} color={brand.primary} />
        </YStack>
      </XStack>
      <XStack alignItems="center" gap="$2" flexWrap="wrap">
        <Title fontVariant={['tabular-nums']}>{value}</Title>
        {change === null ? null : <ChangeBadge change={change} />}
      </XStack>
      <Caption>{caption}</Caption>
    </Surface>
  );
}
