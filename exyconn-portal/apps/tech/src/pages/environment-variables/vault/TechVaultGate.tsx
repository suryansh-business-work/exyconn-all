import { useEffect, type ReactNode } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { FormSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useLockTechVaultMutation,
  useTechVaultStatusQuery,
} from '@exyconn/shell/graphql/generated';
import { forgetTechSecrets } from '../techSecretsCache';
import { UnlockVaultForm } from './forms/unlock-vault';
import { VaultSessionBar } from './VaultSessionBar';

/** The locked screen: what the lock is for, and the unlock form. */
function VaultLocked({ email, onUnlocked }: Readonly<{ email: string; onUnlocked: () => void }>) {
  const t = useT();
  return (
    <Box sx={{ ...readingPanel, maxWidth: 560 }}>
      <Flex direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <LockIcon color="primary" />
        <Heading level={5}>{t('Environment Variables are locked')}</Heading>
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
        {t(
          'They hold the credentials the whole platform runs on. Unlock them with a one-time code for 30 minutes; every unlock is recorded with who, when, why, the IP address, browser and location.',
        )}
      </Text>
      <UnlockVaultForm email={email} onUnlocked={onUnlocked} />
    </Box>
  );
}

/**
 * Keeps Tech > Environment Variables behind a one-time code. The server enforces the same lock
 * on every change and reveal; this screen is what a locked person sees instead of the page.
 * At the end of the 30 minutes the page locks itself and forgets every value it fetched.
 */
export function TechVaultGate({ children }: Readonly<{ children: ReactNode }>) {
  const notify = useNotify();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useTechVaultStatusQuery({
    fetchPolicy: 'network-only',
  });
  const [lock, { loading: locking }] = useLockTechVaultMutation();
  const session = data?.techVaultStatus ?? null;
  const expiresAt = session?.expiresAt;

  useEffect(() => {
    if (!expiresAt) {
      return undefined;
    }
    const wait = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const timer = globalThis.setTimeout(() => {
      forgetTechSecrets();
      refetch().catch((err: unknown) => portalLogger.warn('Vault status reload failed', err));
    }, wait);
    return () => globalThis.clearTimeout(timer);
  }, [expiresAt, refetch]);

  const lockNow = async () => {
    try {
      await lock();
      forgetTechSecrets();
      await refetch();
      notify('Environment Variables locked');
    } catch (err) {
      notify(errorMessage(err, 'Could not lock'), 'error');
    }
  };

  if (loading && !data) {
    return <FormSkeleton fields={3} label="Checking the lock" />;
  }
  if (error && !data) {
    return <Text color="error">{error.message}</Text>;
  }
  if (!session) {
    return (
      <VaultLocked
        email={user?.email ?? ''}
        onUnlocked={() => {
          refetch().catch((err: unknown) => portalLogger.warn('Vault status reload failed', err));
        }}
      />
    );
  }
  return (
    <>
      <VaultSessionBar
        expiresAt={session.expiresAt}
        locking={locking}
        onLock={() => {
          lockNow().catch((err: unknown) => portalLogger.warn('Locking failed', err));
        }}
      />
      {children}
    </>
  );
}
