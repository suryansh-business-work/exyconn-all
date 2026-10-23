import { useFormatters, useT } from '@exyconn/i18n';
import { Chip, Flex, ListItemButton, Stack, Text } from '@exyconn/shell/components/ui';
import type { EmailThread } from './emailTypes';
import { useMessageCount } from './useMessageCount';

interface EmailThreadRowProps {
  thread: EmailThread;
  onOpen: (thread: EmailThread) => void;
}

/** One conversation in the list: subject, who wrote last and when, and a one-line preview. */
export function EmailThreadRow({ thread, onOpen }: Readonly<EmailThreadRowProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const countLabel = useMessageCount();
  const latest = thread.messages.at(-1);
  return (
    <ListItemButton
      divider
      onClick={() => onOpen(thread)}
      sx={{ alignItems: 'flex-start', py: 1.5 }}
    >
      <Stack spacing={0.5} sx={{ minWidth: 0, width: '100%' }}>
        <Flex direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Text component="span" weight="semibold" noWrap sx={{ minWidth: 0, flexShrink: 1 }}>
            {thread.subject || t('(no subject)')}
          </Text>
          <Chip size="small" variant="outlined" label={countLabel(thread.messages.length)} />
          <Text
            component="span"
            size="caption"
            color="text.secondary"
            sx={{ ml: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <time dateTime={thread.lastAt}>{formatDateTime(thread.lastAt)}</time>
          </Text>
        </Flex>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          {latest && (
            <Text
              component="span"
              size="caption"
              color="text.secondary"
              sx={{ overflowWrap: 'anywhere' }}
            >
              {latest.from}
            </Text>
          )}
          {thread.mailbox && <Chip size="small" color="info" label={thread.mailbox} />}
        </Flex>
        {latest?.snippet && (
          <Text component="span" size="sm" color="text.secondary" noWrap>
            {latest.snippet}
          </Text>
        )}
      </Stack>
    </ListItemButton>
  );
}
