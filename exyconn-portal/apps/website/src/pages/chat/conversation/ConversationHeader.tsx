import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { HTTP_URL } from '@exyconn/regex';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Flex, Grid, Heading, Link, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import { CHAT_PATHS } from '../chat.routes';
import { ChatConsoleStatus } from '../alerts/ChatConsoleStatus';
import { SITE_LABEL } from '../sessions/chat-sessions-grid';
import type { ChatSession } from '../socket/chatSocket.types';
import { ConversationActions, type ConversationActionsProps } from './ConversationActions';

interface ConversationHeaderProps extends ConversationActionsProps {
  session: ChatSession;
}

/** One labelled detail of the visitor. */
function Detail({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  const t = useT();
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Text size="caption" color="text.secondary" component="div">
        {t(label)}
      </Text>
      <Text size="sm" sx={{ overflowWrap: 'anywhere' }} component="div">
        {children}
      </Text>
    </Grid>
  );
}

/** Who the visitor is, where they wrote from, who has the chat, and what can be done with it. */
export function ConversationHeader({ session, ...actions }: Readonly<ConversationHeaderProps>) {
  const t = useT();

  return (
    <Box sx={{ mb: 2 }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Button component={RouterLink} to={CHAT_PATHS.sessions} startIcon={<ArrowBackIcon />}>
          {t('Back to chat sessions')}
        </Button>
        <ChatConsoleStatus />
      </Flex>
      <Box sx={[panel, { p: 2 }]}>
        <Flex
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 2 }}
        >
          <Flex direction="row" spacing={1} alignItems="center">
            <Heading level={1} sx={{ typography: 'h5' }}>
              {session.name}
            </Heading>
            <StatusChip value={session.status} />
          </Flex>
          <ConversationActions {...actions} />
        </Flex>
        <Grid container spacing={1.5}>
          <Detail label="Email">
            <Link href={`mailto:${session.email}`}>{session.email}</Link>
          </Detail>
          <Detail label="Phone">{session.phone || '—'}</Detail>
          <Detail label="Site">{t(SITE_LABEL[session.site])}</Detail>
          <Detail label="Page">
            {HTTP_URL.test(session.pageUrl) ? (
              <Link href={session.pageUrl} target="_blank" rel="noopener noreferrer">
                {session.pageUrl}
              </Link>
            ) : (
              session.pageUrl || '—'
            )}
          </Detail>
          <Detail label="Ticket">{session.ticketReference || '—'}</Detail>
          <Detail label="Assignee">{session.assigneeName || t('Unassigned')}</Detail>
        </Grid>
      </Box>
    </Box>
  );
}
