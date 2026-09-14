import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';

import { useGetSupportTicketQuery } from '@exyconn/shell/graphql/generated';
import { TicketDetailBody } from './TicketDetailBody';
import { panel } from '@exyconn/shell/components/glass/glass';

/**
 * One ticket on its own page, so it can be linked to — from a notification email, a
 * chat message, or a colleague's "have a look at this one". It renders exactly the same
 * body as the drawer the grid opens; only the frame around it differs.
 */
export function TicketDetailPage() {
  const { id = '' } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const { data, loading, refetch } = useGetSupportTicketQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });

  const ticket = data?.getSupportTicket;
  const backToQueue = () => navigate('/support/tickets');
  const emptyMessage = loading ? t('Loading…') : t('This ticket no longer exists.');

  return (
    <Box>
      {/* A subject and a reference are the customer's words, not ours: passed as VALUES of a
          template, so they are shown as written and never become catalogue keys. */}
      <PageHeader
        title={ticket ? '{subject}' : 'Ticket'}
        titleValues={ticket ? { subject: ticket.subject } : undefined}
        subtitle={ticket ? '{reference}' : ''}
        subtitleValues={ticket ? { reference: ticket.reference } : undefined}
      >
        <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={backToQueue}>
          {t('Back to queue')}
        </Button>
      </PageHeader>
      <Box sx={panel}>
        {ticket ? (
          <TicketDetailBody
            ticket={ticket}
            onChanged={() => {
              refetch().catch(() => undefined);
            }}
            onCancel={backToQueue}
          />
        ) : (
          <Text color="text.secondary">{emptyMessage}</Text>
        )}
      </Box>
    </Box>
  );
}
