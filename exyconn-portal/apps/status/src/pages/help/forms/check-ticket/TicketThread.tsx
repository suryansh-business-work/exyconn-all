import { useT } from '@exyconn/i18n';
import { Box, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import { TIME_FORMAT } from '../../../../status.constants';
import type { ClientTicket } from './check-ticket.types';

/**
 * What has been said publicly on the ticket.
 *
 * The server sends only public replies — internal notes never leave the desk — so there is
 * nothing to filter here, and nothing here should start filtering, because a filter on this
 * side would be the only thing standing between a customer and an internal note.
 */
export function TicketThread({ replies }: Readonly<{ replies: ClientTicket['replies'] }>) {
  const t = useT();
  if (replies.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
        {t('Nobody has replied yet. You will get an email when they do.')}
      </Typography>
    );
  }
  return (
    <Box sx={{ mt: 1.5 }}>
      {replies.map((reply) => (
        <Box key={reply.id} sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: fontWeight.bold }}>
            {reply.authorName || t('Support')}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            {formatWith(reply.createdAt, TIME_FORMAT)}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {reply.body}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
