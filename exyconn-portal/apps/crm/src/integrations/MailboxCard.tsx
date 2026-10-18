import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Switch, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { GmailAccountStatus } from '@exyconn/shell/graphql/generated';

/** What a card shows of a connected Gmail or Microsoft mailbox. */
export interface Mailbox {
  id: string;
  email: string;
  enabled: boolean;
  status: GmailAccountStatus;
  lastError: string;
  connectedByName: string;
}

/** What can be done to one mailbox. */
export interface MailboxActions<T extends Mailbox> {
  connect: () => Promise<void>;
  connecting: boolean;
  toggle: (account: T, enabled: boolean) => Promise<void>;
  remove: (account: T) => Promise<void>;
}

interface MailboxCardProps<T extends Mailbox> {
  account: T;
  actions: MailboxActions<T>;
  /** When it was last synced or used, already in words, e.g. "Last synced: 3 Oct, 10:00". */
  activity: string;
  /** The address's heading level: h2 on its own page, h3 inside another section. */
  heading?: 'h2' | 'h3';
}

const logFailure = (error: unknown) => portalLogger.warn('crm: mailbox action failed', error);

/** One connected mailbox: whether the CRM uses it, how it last went, and what to do about it. */
export function MailboxCard<T extends Mailbox>({
  account,
  actions,
  activity,
  heading = 'h2',
}: Readonly<MailboxCardProps<T>>) {
  const t = useT();
  const needsReconnect = account.status === GmailAccountStatus.NeedsReconnect;
  const switchLabel = `use-${account.id}`;
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
          <Text component={heading} weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
            {account.email}
          </Text>
          <Chip
            size="small"
            color={needsReconnect ? 'warning' : 'success'}
            label={needsReconnect ? t('Needs reconnecting') : t('Connected')}
          />
        </Flex>
        <Flex direction="row" spacing={0.5} alignItems="center">
          <Text size="sm" component="span" id={switchLabel}>
            {t('Use for CRM')}
          </Text>
          <Switch
            checked={account.enabled}
            onChange={(event) => {
              actions.toggle(account, event.target.checked).catch(logFailure);
            }}
            slotProps={{ input: { 'aria-labelledby': switchLabel } }}
          />
        </Flex>
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mt: 1 }}>
        {activity}
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
