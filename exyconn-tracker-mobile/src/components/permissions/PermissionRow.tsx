import { XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { PermissionInfo } from '../../lib/permissions/permission-rows';
import { useBrand } from '../../theme/BrandProvider';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { AppButton } from '../ui/AppButton';
import { Icon } from '../ui/Icon';
import { Surface } from '../ui/Surface';
import { Body, Caption } from '../ui/Typography';

/** The brand colour at 18% (hex alpha), the tile the desktop puts behind a grant's icon. */
const TILE_ALPHA = '2e';
const TILE_SIZE = 40;

interface Props {
  permission: PermissionInfo;
  busy: boolean;
  onGrant: () => void;
}

/** One missing grant: what it is, why it is needed, and how to give it. */
export function PermissionRow({ permission, busy, onGrant }: Readonly<Props>) {
  const t = useT();
  const brand = useBrand();
  const title = t(permission.title);
  const action = t(permission.actionLabel);
  return (
    <Surface gap="$3">
      <XStack gap="$3" alignItems="flex-start">
        <YStack
          width={TILE_SIZE}
          height={TILE_SIZE}
          borderRadius={TRACKER_RADIUS}
          alignItems="center"
          justifyContent="center"
          backgroundColor={`${brand.primary}${TILE_ALPHA}`}
        >
          <Icon name={permission.icon} color={brand.primary} />
        </YStack>
        <YStack flex={1} gap="$1">
          <Body fontWeight="600">{title}</Body>
          <Caption>{t(permission.reason)}</Caption>
        </YStack>
      </XStack>
      <XStack justifyContent="flex-end">
        <AppButton
          label={action}
          disabled={busy}
          accessibilityLabel={t('{action}: {permission}', { action, permission: title })}
          onPress={onGrant}
        />
      </XStack>
    </Surface>
  );
}
