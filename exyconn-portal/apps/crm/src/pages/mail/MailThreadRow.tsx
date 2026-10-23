import AttachFileIcon from '@mui/icons-material/AttachFile';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Checkbox,
  Flex,
  IconButton,
  ListItem,
  ListItemButton,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { CrmMailThreadsQuery } from '@exyconn/shell/graphql/generated';
import { RecordChip } from './reader/ReaderHeader';

export type MailRow = CrmMailThreadsQuery['crmMailThreads']['rows'][number];

interface MailThreadRowProps {
  row: MailRow;
  checked: boolean;
  /** It is the conversation open in the reader. */
  active: boolean;
  /** Several mailboxes are listed together, so each row says which one it is in. */
  showMailbox: boolean;
  onCheck: (row: MailRow) => void;
  onOpen: (row: MailRow) => void;
  onStar: (row: MailRow) => void;
}

/** Who the row is shown as: the sender, or the first recipient on mail the mailbox sent. */
function correspondent(row: MailRow, t: ReturnType<typeof useT>) {
  if (row.fromAddress !== row.mailbox) {
    return row.fromName || row.fromAddress;
  }
  const other = row.participants.find((address) => address !== row.mailbox);
  return other ? t('To: {list}', { list: other }) : t('Me');
}

/** One conversation in the list: select, star, open, and its CRM record when it has one. */
export function MailThreadRow({
  row,
  checked,
  active,
  showMailbox,
  onCheck,
  onOpen,
  onStar,
}: Readonly<MailThreadRowProps>) {
  const t = useT();
  const { formatRelative, formatDateTime } = useFormatters();
  const weight = row.unread ? 'semibold' : 'regular';
  const subject = row.subject || t('(no subject)');
  const count = row.messageCount > 1 ? ` (${row.messageCount})` : '';
  return (
    <ListItem
      disablePadding
      divider
      sx={{ alignItems: 'flex-start', bgcolor: row.unread ? 'action.hover' : undefined }}
    >
      <Flex direction="column" alignItems="center" sx={{ pt: 0.5 }}>
        <Checkbox
          checked={checked}
          onChange={() => onCheck(row)}
          slotProps={{ input: { 'aria-label': t('Select "{subject}"', { subject }) } }}
        />
        <IconButton
          size="small"
          onClick={() => onStar(row)}
          aria-label={row.starred ? t('Remove star') : t('Star')}
          aria-pressed={row.starred}
        >
          {row.starred ? (
            <StarIcon fontSize="small" color="warning" />
          ) : (
            <StarBorderIcon fontSize="small" />
          )}
        </IconButton>
      </Flex>
      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, py: 0.5, pr: 1 }}>
        <ListItemButton
          selected={active}
          onClick={() => onOpen(row)}
          sx={{ display: 'block', borderRadius: 1, px: 1 }}
        >
          <Flex direction="row" spacing={1} justifyContent="space-between" alignItems="baseline">
            <Text size="sm" weight={weight} noWrap>
              {correspondent(row, t)}
              {count}
            </Text>
            <Text size="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              <time dateTime={row.lastAt} title={formatDateTime(row.lastAt)}>
                {formatRelative(row.lastAt)}
              </time>
            </Text>
          </Flex>
          <Text size="sm" weight={weight} noWrap>
            {subject}
          </Text>
          <Text size="caption" color="text.secondary" noWrap>
            {row.snippet}
          </Text>
        </ListItemButton>
        <Flex
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ px: 1 }}
        >
          {row.hasAttachments && (
            <AttachFileIcon fontSize="small" color="action" titleAccess={t('Has attachments')} />
          )}
          {showMailbox && (
            <Text size="caption" color="text.secondary">
              {row.mailbox}
            </Text>
          )}
          <RecordChip record={row.record} />
        </Flex>
      </Stack>
    </ListItem>
  );
}
