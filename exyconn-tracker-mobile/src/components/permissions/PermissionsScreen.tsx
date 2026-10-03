import type { TrackerStatus } from '@exyconn/tracker-core';
import { Linking } from 'react-native';
import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { missingPermissions } from '../../lib/permissions/permission-rows';
import { refreshPermissions, requestPermission } from '../../tracker/instance';
import { usePendingAction } from '../../hooks/usePendingAction';
import { run } from '../../tracker/run';
import type { Capabilities, MobilePermissions, PermissionKind } from '../../tracker/types';
import { AppFooter } from '../shell/AppFooter';
import { AppButton } from '../ui/AppButton';
import { BrandMark } from '../ui/BrandMark';
import { Notice } from '../ui/Notice';
import { ScreenLayout } from '../ui/ScreenLayout';
import { Surface } from '../ui/Surface';
import { Caption, Title } from '../ui/Typography';
import { PermissionRow } from './PermissionRow';
import { SignOutButton } from '../shell/SignOutButton';

/** A grant being asked for, a re-check, or the trip to Settings — one at a time. */
type PermissionAction = PermissionKind | 'recheck' | 'settings';

const REQUEST_FAILED = 'The phone did not answer the request. Try again, or allow it in Settings.';

interface Props {
  permissions: MobilePermissions;
  capabilities: Capabilities;
  status: TrackerStatus;
  /** Items still waiting to upload — sign-out sends them first. */
  pendingSync: number;
}

/**
 * The OS grants the tracker still needs, asked for one at a time with the reason beside each.
 * The list re-reads itself whenever the app comes back to the front, so returning from
 * Settings is enough — Re-check is there for anyone who wants to be sure.
 */
export function PermissionsScreen({
  permissions,
  capabilities,
  status,
  pendingSync,
}: Readonly<Props>) {
  const t = useT();
  const { pending, error, perform } = usePendingAction<PermissionAction>();
  const busy = pending !== null;
  const missing = missingPermissions(permissions, capabilities);

  function press(key: PermissionAction, action: () => Promise<void>): void {
    run(() => perform(key, action, t(REQUEST_FAILED)));
  }

  return (
    <ScreenLayout maxWidth={520}>
      <YStack alignItems="center" paddingVertical="$3">
        <BrandMark height={36} />
      </YStack>
      <Surface padding="$5" gap="$4">
        <YStack gap="$1">
          <Title>{t('Grant permissions')}</Title>
          <Caption>
            {t(
              'Your phone needs your permission before the tracker can work. Grant each item below — the list updates by itself when you come back to the app.',
            )}
          </Caption>
        </YStack>

        {error === null ? null : <Notice severity="error">{error}</Notice>}

        <YStack gap="$3">
          {missing.map((permission) => (
            <PermissionRow
              key={permission.kind}
              permission={permission}
              busy={busy}
              loading={pending === permission.kind}
              onGrant={() => press(permission.kind, () => requestPermission(permission.kind))}
            />
          ))}
        </YStack>

        <AppButton
          label={t('Re-check')}
          tone="outlined"
          icon="refresh"
          full
          disabled={busy}
          busy={pending === 'recheck'}
          onPress={() => press('recheck', refreshPermissions)}
        />
        <YStack gap="$2">
          <Caption>
            {t(
              "Some features will not work until these are granted. If tapping Allow shows nothing, the phone has stopped asking — allow it in this app's Settings instead.",
            )}
          </Caption>
          <AppButton
            label={t('Open Settings')}
            tone="text"
            icon="cog-outline"
            full
            disabled={busy}
            busy={pending === 'settings'}
            onPress={() => press('settings', () => Linking.openSettings())}
          />
        </YStack>
      </Surface>
      <SignOutButton status={status} pendingSync={pendingSync} />
      <AppFooter />
    </ScreenLayout>
  );
}
