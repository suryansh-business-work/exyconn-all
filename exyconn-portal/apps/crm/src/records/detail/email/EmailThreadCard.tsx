import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Button, Chip, Divider, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { CrmEmailDirection, type CrmEmailThreadsQuery } from '@exyconn/shell/graphql/generated';

export type EmailThread = CrmEmailThreadsQuery['crmEmailThreads'][number];

/** One conversation, oldest message first, with a Reply that answers the latest. */
export function EmailThreadCard({
  thread,
  onReply,
}: Readonly<{ thread: EmailThread; onReply: (thread: EmailThread) => void }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return (
    <Box component="article" sx={panel}>
      <Flex
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        <Text component="h3" weight="semibold">
          {thread.subject || t('(no subject)')}
        </Text>
        <Button size="small" variant="outlined" onClick={() => onReply(thread)}>
          {t('Reply')}
        </Button>
      </Flex>
      <Stack spacing={1.5} divider={<Divider flexItem />} sx={{ mt: 1.5 }}>
        {thread.messages.map((message) => (
          <Stack key={message.id} spacing={0.5}>
            <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                color={message.direction === CrmEmailDirection.Out ? 'primary' : 'default'}
                label={message.direction === CrmEmailDirection.Out ? t('Sent') : t('Received')}
              />
              <Text size="sm" weight="semibold">
                {message.from}
              </Text>
              <Text size="caption" color="text.secondary">
                <time dateTime={message.sentAt}>{formatDateTime(message.sentAt)}</time>
              </Text>
            </Flex>
            <Text size="sm" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
              {message.bodyText || message.snippet}
            </Text>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
