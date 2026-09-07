import { Box, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { AttachmentList, type AttachmentItem } from '@exyconn/shell/components/upload';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useMySupportRepliesQuery } from '@exyconn/shell/graphql/generated';
import { SupportReplyForm, type SupportReplyRow } from './forms/support-reply';

interface ReplyBubbleProps {
  reply: SupportReplyRow;
  when: string;
}

/** One message in the thread, with who wrote it and when. */
function ReplyBubble({ reply, when }: Readonly<ReplyBubbleProps>) {
  return (
    <Box sx={{ py: 1, px: 1.5, borderRadius: 1, bgcolor: 'action.hover' }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Text size="sm" weight="medium">
          {reply.authorName}
        </Text>
        <Text size="sm" color="text.secondary">
          {when}
        </Text>
      </Flex>
      <Text sx={{ whiteSpace: 'pre-wrap' }}>{reply.body}</Text>
      <AttachmentList items={reply.attachments} />
    </Box>
  );
}

interface SupportThreadProps {
  ticketId: string;
  description: string;
  /** What the employee attached when they raised it. */
  attachments: readonly AttachmentItem[];
  onClose: () => void;
}

/** The public conversation on one of the employee's tickets, and a box to continue it. */
export function SupportThread({
  ticketId,
  description,
  attachments,
  onClose,
}: Readonly<SupportThreadProps>) {
  const { data, loading, refetch } = useMySupportRepliesQuery({
    variables: { ticketId },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDateTime } = useSettings();
  const replies = data?.mySupportReplies ?? [];

  let thread = <Text color="text.secondary">No replies yet — support will answer you here.</Text>;
  if (replies.length > 0) {
    thread = (
      <Flex direction="column" spacing={1}>
        {replies.map((reply) => (
          <ReplyBubble key={reply.id} reply={reply} when={formatDateTime(reply.createdAt)} />
        ))}
      </Flex>
    );
  } else if (loading) {
    thread = <Text color="text.secondary">Loading…</Text>;
  }

  return (
    <Flex direction="column" spacing={2}>
      <Text sx={{ whiteSpace: 'pre-wrap' }}>{description}</Text>
      <AttachmentList items={attachments} />
      <Divider />
      {thread}
      <SupportReplyForm
        ticketId={ticketId}
        onCancel={onClose}
        onDone={() => {
          refetch().catch(() => undefined);
        }}
      />
    </Flex>
  );
}
