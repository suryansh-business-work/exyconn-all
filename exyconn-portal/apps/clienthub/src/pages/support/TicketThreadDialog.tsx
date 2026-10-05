import { useT } from '@exyconn/i18n';
import { Divider, Paper, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useClientHubTicketRepliesQuery } from '@exyconn/shell/graphql/generated';
import { TicketReplyForm } from './forms/ticket-reply';
import type { ClientTicketRow } from './tickets-grid';

interface TicketThreadDialogProps {
  ticket: ClientTicketRow | null;
  onClose: () => void;
}

/** One ticket's conversation: what the client wrote, every reply from support, and a reply box. */
export function TicketThreadDialog({ ticket, onClose }: Readonly<TicketThreadDialogProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const { data, refetch } = useClientHubTicketRepliesQuery({
    variables: { ticketId: ticket?.id ?? '' },
    skip: !ticket,
  });
  const replies = data?.clientHubTicketReplies ?? [];
  const title = ticket ? `${ticket.reference} — ${ticket.subject}` : '';

  return (
    <CrudDialog open={ticket !== null} title={title} onClose={onClose}>
      {ticket && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <StatusChip value={ticket.status} />
            <StatusChip value={ticket.priority} />
          </Stack>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Text size="caption" color="text.secondary">
              {t('You wrote, {when}', { when: formatDateTime(ticket.createdAt) })}
            </Text>
            <Text sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{ticket.description}</Text>
          </Paper>
          {replies.map((reply) => (
            <Paper key={reply.id} variant="outlined" sx={{ p: 2 }}>
              <Text size="caption" color="text.secondary">
                {t('{name}, {when}', {
                  name: reply.authorName,
                  when: formatDateTime(reply.createdAt),
                })}
              </Text>
              <Text sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{reply.body}</Text>
            </Paper>
          ))}
          <Divider />
          <TicketReplyForm ticketId={ticket.id} onReplied={() => refetch()} />
        </Stack>
      )}
    </CrudDialog>
  );
}
