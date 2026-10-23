import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Flex, Text } from '@/components/ui';
import { MailboxStatus, PROVIDER_NAMES, ProviderLogo } from '@/components/mailboxes';
import { GmailAccountStatus, type MyMailboxFieldsFragment } from '@/graphql/generated';

type Mailbox = MyMailboxFieldsFragment;

export interface MyMailboxItemActions {
  test: (mailbox: Mailbox) => void;
  makeDefault: (mailbox: Mailbox) => void;
  remove: (mailbox: Mailbox) => void;
  reconnect: (mailbox: Mailbox) => void;
  showError: (mailbox: Mailbox) => void;
}

interface MyMailboxItemProps {
  mailbox: Mailbox;
  actions: MyMailboxItemActions;
}

/** One of the person's own mailboxes: who, its state, and what can be done with it. */
export function MyMailboxItem({ mailbox, actions }: Readonly<MyMailboxItemProps>) {
  const t = useT();
  const needsReconnect = mailbox.status === GmailAccountStatus.NeedsReconnect;
  return (
    <Flex
      component="li"
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      sx={{ py: 1.5, borderBottom: 1, borderColor: 'divider' }}
    >
      <Flex direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
        <ProviderLogo provider={mailbox.provider} size={28} />
        <Box sx={{ minWidth: 0 }}>
          <Text weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
            {mailbox.email}
          </Text>
          <Text size="sm" color="text.secondary">
            {PROVIDER_NAMES[mailbox.provider]}
          </Text>
        </Box>
        {mailbox.isDefault && <Chip size="small" label={t('Default')} />}
      </Flex>
      <MailboxStatus row={mailbox} />
      <Flex direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
        {mailbox.lastError && (
          <Button size="small" onClick={() => actions.showError(mailbox)}>
            {t('View details')}
          </Button>
        )}
        {needsReconnect ? (
          <Button size="small" onClick={() => actions.reconnect(mailbox)}>
            {t('Reconnect')}
          </Button>
        ) : (
          <Button size="small" onClick={() => actions.test(mailbox)}>
            {t('Test')}
          </Button>
        )}
        {!mailbox.isDefault && (
          <Button size="small" onClick={() => actions.makeDefault(mailbox)}>
            {t('Make default')}
          </Button>
        )}
        <Button size="small" color="error" onClick={() => actions.remove(mailbox)}>
          {t('Disconnect')}
        </Button>
      </Flex>
    </Flex>
  );
}
