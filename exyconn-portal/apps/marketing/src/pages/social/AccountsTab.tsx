import { useT } from '@exyconn/i18n';
import SyncIcon from '@mui/icons-material/Sync';
import { Button, Flex, Grid, Heading, Text } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ProviderCard } from './ProviderCard';
import { ConnectedAccountsTable } from './ConnectedAccountsTable';
import { useConnectOutcome } from './useConnectOutcome';
import { useSocialAccounts } from './useSocialAccounts';

/** Social › Accounts: connect LinkedIn, Meta, X and YouTube accounts, and keep them in sync. */
export function AccountsTab() {
  const t = useT();
  const social = useSocialAccounts();
  useConnectOutcome(social.reload);

  return (
    <>
      <Text component="p" size="sm" color="text.secondary" sx={{ mb: 2 }}>
        {t(
          'You sign in on the network’s own page — Exyconn never sees the password. Posts and their numbers are read every six hours, or now with Sync.',
        )}
      </Text>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {social.providers.map((provider) => (
          <Grid key={provider.app} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProviderCard
              provider={provider}
              connecting={social.connecting === provider.app}
              onConnect={() => {
                social
                  .connect(provider.app)
                  .catch((error: unknown) =>
                    portalLogger.error('Starting a social connection failed', error),
                  );
              }}
            />
          </Grid>
        ))}
      </Grid>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Heading level={6}>{t('Connected accounts')}</Heading>
        <Button
          size="small"
          startIcon={<SyncIcon />}
          disabled={social.syncing !== null || social.accounts.length === 0}
          onClick={() => {
            social.sync().catch((error: unknown) => portalLogger.error('Sync failed', error));
          }}
        >
          {social.syncing === 'all' ? t('Syncing…') : t('Sync all')}
        </Button>
      </Flex>
      <ConnectedAccountsTable social={social} />
    </>
  );
}
