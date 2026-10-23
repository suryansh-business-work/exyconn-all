import AllInboxIcon from '@mui/icons-material/AllInbox';
import { useT } from '@exyconn/i18n';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from '@exyconn/shell/components/ui';
import { GmailAccountStatus, type CrmMailOverviewQuery } from '@exyconn/shell/graphql/generated';
import { ProviderLogo } from '../../integrations/ProviderLogo';

export type MailboxItem = CrmMailOverviewQuery['crmMailOverview']['mailboxes'][number];

interface MailboxListProps {
  mailboxes: MailboxItem[];
  /** The chosen mailbox's id; '' is every mailbox together. */
  selected: string;
  onSelect: (id: string) => void;
}

/** Why a mailbox cannot be read here, or its unread count when it can. */
function secondaryOf(mailbox: MailboxItem, t: ReturnType<typeof useT>) {
  if (mailbox.readable) {
    return mailbox.unreadCount > 0 ? t('{count} unread', { count: mailbox.unreadCount }) : '';
  }
  if (mailbox.status === GmailAccountStatus.NeedsReconnect) {
    return t('Reconnect it in Integrations');
  }
  return t('Sends only; reading needs Gmail');
}

/** "All mailboxes" and every mailbox turned on for the CRM, each with its provider's logo. */
export function MailboxList({ mailboxes, selected, onSelect }: Readonly<MailboxListProps>) {
  const t = useT();
  return (
    <List
      dense
      aria-label={t('Mailboxes')}
      subheader={<ListSubheader disableSticky>{t('Mailboxes')}</ListSubheader>}
    >
      <ListItemButton selected={selected === ''} onClick={() => onSelect('')}>
        <ListItemIcon>
          <AllInboxIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('All mailboxes')} />
      </ListItemButton>
      {mailboxes.map((mailbox) => (
        <ListItemButton
          key={mailbox.id}
          selected={selected === mailbox.id}
          disabled={!mailbox.readable}
          onClick={() => onSelect(mailbox.id)}
        >
          <ListItemIcon>
            <ProviderLogo provider={mailbox.provider} decorative={false} />
          </ListItemIcon>
          <ListItemText
            primary={mailbox.email}
            secondary={secondaryOf(mailbox, t)}
            slotProps={{ primary: { noWrap: true, title: mailbox.email } }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}
