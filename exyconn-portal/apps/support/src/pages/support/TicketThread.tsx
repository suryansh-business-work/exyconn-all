import { Box, Chip, Stack, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useListSupportRepliesQuery } from '@exyconn/shell/graphql/generated';

interface TicketThreadProps {
  ticketId: string;
}

/**
 * Everything said on a ticket, oldest first. An internal note is tinted and
 * labelled, because the one thing that must never be ambiguous here is whether
 * the employee can see a message.
 */
export function TicketThread({ ticketId }: Readonly<TicketThreadProps>) {
  const { data, loading } = useListSupportRepliesQuery({
    variables: { ticketId },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDateTime } = useSettings();

  const replies = data?.listSupportReplies ?? [];

  if (loading && replies.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        Loading the thread…
      </Text>
    );
  }

  if (replies.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        Nothing has been said on this ticket yet.
      </Text>
    );
  }

  return (
    <Stack spacing={1.25}>
      {replies.map((reply) => (
        <Box
          key={reply.id}
          sx={{
            p: 1.25,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: reply.internal ? 'warning.light' : 'divider',
            bgcolor: reply.internal ? 'warning.light' : 'background.paper',
            opacity: reply.internal ? 0.95 : 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Text size="sm" weight="medium">
              {reply.authorName}
            </Text>
            {reply.internal && <Chip size="small" label="Internal note" color="warning" />}
            <Text size="caption" color="text.secondary">
              {formatDateTime(reply.createdAt)}
            </Text>
          </Stack>
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
            {reply.body}
          </Text>
        </Box>
      ))}
    </Stack>
  );
}
