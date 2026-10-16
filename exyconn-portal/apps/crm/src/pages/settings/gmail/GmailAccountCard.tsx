import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Switch, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  GmailAccountStatus,
  type GmailAccountFieldsFragment,
} from '@exyconn/shell/graphql/generated';
import type { GmailAccountActions } from './useGmailAccountActions';

interface GmailAccountCardProps {
  account: GmailAccountFieldsFragment;
  actions: GmailAccountActions;
}

const logFailure = (error: unknown) => portalLogger.warn('crm: Gmail account action failed', error);

/** One connected mailbox: whether the CRM uses it, how it last went, and what to do about it. */
export function GmailAccountCard({ account, actions }: Readonly<GmailAccountCardProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const needsReconnect = account.status === GmailAccountStatus.NeedsReconnect;
  const lastSync = account.lastSyncAt ? formatDateTime(account.lastSyncAt) : t('Never');
  return (
    <Box component="article" sx={panel} aria-label={account.email}>
      <Flex
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Text component="h2" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
            {account.email}
          </Text>
          <Chip
            size="small"
            color={needsReconnect ? 'warning' : 'success'}
            label={needsReconnect ? t('Needs reconnecting') : t('Connected')}
          />
        </Flex>
        <Flex direction="row" spacing={0.5} alignItems="center">
          <Text size="sm" component="span" id={`use-${account.id}`}>
            {t('Use for CRM')}
          </Text>
          <Switch
            checked={account.enabled}
            onChange={(event) => {
              actions.toggle(account, event.target.checked).catch(logFailure);
            }}
            slotProps={{ input: { 'aria-labelledby': `use-${account.id}` } }}
          />
        </Flex>
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mt: 1 }}>
        {t('Last synced: {when}', { when: lastSync })}
        {account.connectedByName
          ? ` · ${t('Connected by {name}', { name: account.connectedByName })}`
          : ''}
      </Text>
      {account.lastError && (
        <Alert severity={needsReconnect ? 'warning' : 'info'} sx={{ mt: 1.5 }}>
          {account.lastError}
        </Alert>
      )}
      <Flex direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
        {needsReconnect && (
          <Button
            size="small"
            variant="contained"
            loading={actions.connecting}
            onClick={() => {
              actions.connect().catch(logFailure);
            }}
          >
            {t('Reconnect')}
          </Button>
        )}
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={() => {
            actions.remove(account).catch(logFailure);
          }}
        >
          {t('Disconnect')}
        </Button>
      </Flex>
    </Box>
  );
}
