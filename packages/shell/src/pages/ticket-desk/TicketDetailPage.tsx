import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useT } from '@exyconn/i18n';
import { Box, Button, Text } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

import { useGetSupportTicketQuery } from '@/graphql/generated';
import { TicketDetailBody } from './TicketDetailBody';
import { panel } from '@/components/glass/glass';

/**
 * One ticket on its own page, so it can be linked to — from a notification email, a
 * chat message, or a colleague's "have a look at this one". Shared by Support and IT. It renders exactly the same
 * body as the drawer the grid opens; only the frame around it differs.
 */
interface TicketDetailPageProps {
  /** Where "Back to queue" goes — the Support console or IT's helpdesk. */
  backPath: string;
  /** The desk's ticket topics (IT's). Omit for a desk that does not triage by topic. */
  topics?: readonly string[];
}

export function TicketDetailPage({ backPath, topics }: Readonly<TicketDetailPageProps>) {
  const { id = '' } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const { data, loading, refetch } = useGetSupportTicketQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });

  const ticket = data?.getSupportTicket;
  const backToQueue = () => navigate(backPath);
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
            topics={topics}
          />
        ) : (
          <Text color="text.secondary">{emptyMessage}</Text>
        )}
      </Box>
    </Box>
  );
}
