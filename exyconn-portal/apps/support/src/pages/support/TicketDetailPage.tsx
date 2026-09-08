import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useGetSupportTicketQuery } from '@exyconn/shell/graphql/generated';
import { TicketDetailBody } from './TicketDetailBody';

/**
 * One ticket on its own page, so it can be linked to — from a notification email, a
 * chat message, or a colleague's "have a look at this one". It renders exactly the same
 * body as the drawer the grid opens; only the frame around it differs.
 */
export function TicketDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, loading, refetch } = useGetSupportTicketQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });

  const ticket = data?.getSupportTicket;
  const backToQueue = () => navigate('/support/tickets');
  const emptyMessage = loading ? 'Loading…' : 'This ticket no longer exists.';

  return (
    <Box>
      <PageHeader title={ticket?.subject ?? 'Ticket'} subtitle={ticket?.reference ?? ''}>
        <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={backToQueue}>
          Back to queue
        </Button>
      </PageHeader>
      <Box sx={[glass, { p: { xs: 1.5, md: 2.5 } }]}>
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
