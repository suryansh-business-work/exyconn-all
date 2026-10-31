import type { ICellRendererParams } from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { Badge, Box, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import { WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import { useNow } from '../useNow';
import type { ChatSessionRow, ChatSessionsGridContext } from './chat-sessions-grid';

type CellParams = Readonly<ICellRendererParams<ChatSessionRow>>;

/** The visitor's name with how to reach them underneath. */
export function VisitorCell({ data }: CellParams) {
  if (!data) {
    return null;
  }
  const contact = [data.email, data.phone].filter(Boolean).join(' · ');
  return (
    <Box sx={{ lineHeight: 1.2, py: 0.5 }}>
      <Text size="sm" weight="semibold" noWrap>
        {data.name}
      </Text>
      <Text size="caption" color="text.secondary" noWrap component="div">
        {contact}
      </Text>
    </Box>
  );
}

/** The latest message, with how long ago it came in. */
export function LastMessageCell({ data, context }: CellParams) {
  const t = useT();
  if (!data) {
    return null;
  }
  const { formatRelative } = context as ChatSessionsGridContext;
  const when = data.lastMessageAt ? formatRelative(data.lastMessageAt) : '';
  return (
    <Box sx={{ lineHeight: 1.2, py: 0.5, minWidth: 0 }}>
      <Text size="sm" noWrap>
        {data.lastMessagePreview || t('No messages yet')}
      </Text>
      <Text size="caption" color="text.secondary" component="div">
        {when}
      </Text>
    </Box>
  );
}

/** How many live-thread visitor messages nobody on the team has read yet. */
export function UnreadCell({ data }: CellParams) {
  const t = useT();
  if (!data || data.staffUnread === 0) {
    return null;
  }
  return (
    <Badge
      color="error"
      badgeContent={data.staffUnread}
      max={99}
      aria-label={t('{count} unread', { count: data.staffUnread })}
      sx={{ ml: 1.5 }}
    />
  );
}

/** Who has the chat, with a Slack mark when it is mirrored into their Slack DMs. */
export function AssigneeCell({ data }: CellParams) {
  const t = useT();
  if (!data) {
    return null;
  }
  return (
    <Flex direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%', minWidth: 0 }}>
      <Text size="sm" noWrap>
        {data.assigneeName || t('Unassigned')}
      </Text>
      {data.slackLinked && (
        <Tooltip title={t('Mirrored to a Slack thread')}>
          <ForumOutlinedIcon
            tabIndex={0}
            role="img"
            aria-hidden={false}
            aria-label={t('Mirrored to a Slack thread')}
            fontSize="small"
            color="action"
          />
        </Tooltip>
      )}
    </Flex>
  );
}

/** When an open chat closes if nobody writes, e.g. "in 7 minutes"; refreshed every minute. */
export function ClosesInCell({ data, context }: CellParams) {
  const expiresAt = data?.status === WebsiteChatStatus.Open ? data.expiresAt : null;
  useNow(60_000, Boolean(expiresAt));
  if (!expiresAt) {
    return null;
  }
  const { formatRelative } = context as ChatSessionsGridContext;
  return <Text size="sm">{formatRelative(expiresAt)}</Text>;
}
