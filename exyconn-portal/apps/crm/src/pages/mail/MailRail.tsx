import { Link as RouterLink } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Badge,
  Button,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { CrmMailOverviewQuery } from '@exyconn/shell/graphql/generated';
import { MAIL_FOLDERS, type MailFolderItem } from './mailFolders';
import { MailboxList, type MailboxItem } from './MailboxList';
import { folderHref } from './useMailRoute';
import type { useMailSync } from './useMailSync';

type FolderCount = CrmMailOverviewQuery['crmMailOverview']['folders'][number];

interface MailRailProps {
  folder: MailFolderItem;
  mailbox: string;
  mailboxes: MailboxItem[];
  counts: FolderCount[];
  sync: ReturnType<typeof useMailSync>;
  onCompose: () => void;
  onMailbox: (id: string) => void;
}

/** The newest successful sync among the mailboxes shown; null when none has synced. */
function lastSynced(mailboxes: MailboxItem[], mailbox: string) {
  const times = mailboxes
    .filter((each) => each.readable && (!mailbox || each.id === mailbox))
    .map((each) => each.lastSyncedAt)
    .filter((value): value is string => Boolean(value))
    .toSorted((a, b) => a.localeCompare(b));
  return times.at(-1) ?? null;
}

/** Compose, the folders with their unread counts, the mailbox switcher and Sync now. */
export function MailRail({
  folder,
  mailbox,
  mailboxes,
  counts,
  sync,
  onCompose,
  onMailbox,
}: Readonly<MailRailProps>) {
  const t = useT();
  const { formatRelative } = useFormatters();
  const synced = lastSynced(mailboxes, mailbox);
  const unreadOf = (item: MailFolderItem) =>
    counts.find((count) => count.folder === item.folder)?.unread ?? 0;
  return (
    <Stack spacing={1} component="nav" aria-label={t('Mail folders')}>
      <Button variant="contained" startIcon={<EditIcon />} onClick={onCompose}>
        {t('Compose')}
      </Button>
      <List dense>
        {MAIL_FOLDERS.map((item) => {
          const Icon = item.icon;
          const unread = item.showsUnread ? unreadOf(item) : 0;
          return (
            <ListItemButton
              key={item.slug}
              component={RouterLink}
              to={folderHref(item.slug, mailbox)}
              selected={item.slug === folder.slug}
              aria-current={item.slug === folder.slug ? 'page' : undefined}
            >
              <ListItemIcon>
                <Badge badgeContent={unread} color="primary" max={999}>
                  <Icon fontSize="small" />
                </Badge>
              </ListItemIcon>
              <ListItemText primary={t(item.label)} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <MailboxList mailboxes={mailboxes} selected={mailbox} onSelect={onMailbox} />
      <Divider />
      <Button
        variant="outlined"
        startIcon={<SyncIcon />}
        onClick={sync.sync}
        loading={sync.syncing}
      >
        {t('Sync now')}
      </Button>
      <Text size="caption" color="text.secondary" aria-live="polite">
        {synced ? t('Synced {when}', { when: formatRelative(synced) }) : t('Not synced yet')}
      </Text>
      {sync.error && <Alert severity="error">{sync.error.message}</Alert>}
      {sync.failures.map((failure) => (
        <Alert key={failure.accountId} severity="warning">
          {failure.email}: {failure.error}
        </Alert>
      ))}
    </Stack>
  );
}
