import { useT } from '@exyconn/i18n';
import { borderWidth, Box, Chip, Stack, Text } from '@/components/ui';
import { AttachmentList } from '@/components/upload';
import { useSettings } from '@/hooks/useSettings';
import { useListSupportRepliesQuery } from '@/graphql/generated';

interface TicketThreadProps {
  ticketId: string;
}

/**
 * Everything said on a ticket, oldest first. An internal note is tinted and
 * labelled, because the one thing that must never be ambiguous here is whether
 * the employee can see a message.
 */
export function TicketThread({ ticketId }: Readonly<TicketThreadProps>) {
  const t = useT();
  const { data, loading } = useListSupportRepliesQuery({
    variables: { ticketId },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDateTime } = useSettings();

  const replies = data?.listSupportReplies ?? [];

  if (loading && replies.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Loading the thread…')}
      </Text>
    );
  }

  if (replies.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Nothing has been said on this ticket yet.')}
      </Text>
    );
  }

  return (
    <Stack spacing={1.5}>
      {replies.map((reply) => (
        <Box
          key={reply.id}
          sx={{
            p: 1.5,
            borderRadius: 1.5,
            border: `${borderWidth.hairline}px solid`,
            borderColor: reply.internal ? 'warning.light' : 'divider',
            bgcolor: reply.internal ? 'warning.light' : 'background.paper',
            opacity: reply.internal ? 0.95 : 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              mb: 0.5,
            }}
          >
            <Text size="sm" weight="medium">
              {reply.authorName}
            </Text>
            {reply.internal && <Chip size="small" label={t('Internal note')} color="warning" />}
            <Text size="caption" color="text.secondary">
              {formatDateTime(reply.createdAt)}
            </Text>
          </Stack>
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
            {reply.body}
          </Text>
          <AttachmentList items={reply.attachments} />
        </Box>
      ))}
    </Stack>
  );
}
