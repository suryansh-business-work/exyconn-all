import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFormatters, useT } from '@exyconn/i18n';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Divider,
  Flex,
  Stack,
  Text,
} from '@exyconn/shell/components/ui';
import type { CrmEmailThreadsQuery } from '@exyconn/shell/graphql/generated';
import { EmailMessageItem } from './EmailMessageItem';

export type EmailThread = CrmEmailThreadsQuery['crmEmailThreads'][number];

interface EmailThreadCardProps {
  thread: EmailThread;
  onReply: (thread: EmailThread) => void;
  /** The newest thread opens expanded. */
  defaultExpanded?: boolean;
}

/**
 * MUI wraps the summary in an h3 (the Accordion's heading slot), so the subject inside is plain
 * text — a second heading there would nest one heading in another.
 *
 * One conversation in one connected mailbox: subject, mailbox and latest message at a glance;
 * expanded, every message oldest first and a Reply that answers in the same thread.
 */
export function EmailThreadCard({
  thread,
  onReply,
  defaultExpanded = false,
}: Readonly<EmailThreadCardProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const latest = thread.messages.at(-1);
  const summaryId = `thread-${thread.accountId}-${thread.threadId}`;
  return (
    <Accordion disableGutters defaultExpanded={defaultExpanded} component="article">
      <AccordionSummary expandIcon={<ExpandMoreIcon />} id={summaryId}>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Text component="span" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
              {thread.subject || t('(no subject)')}
            </Text>
            <Chip
              size="small"
              variant="outlined"
              label={t('{count} messages', { count: thread.messages.length })}
            />
            {thread.mailbox && <Chip size="small" color="info" label={thread.mailbox} />}
          </Flex>
          <Text size="caption" color="text.secondary">
            <time dateTime={thread.lastAt}>{formatDateTime(thread.lastAt)}</time>
            {latest ? ` · ${latest.from}` : ''}
          </Text>
          {latest?.snippet && (
            <Text size="sm" color="text.secondary" noWrap>
              {latest.snippet}
            </Text>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack
          component="ol"
          spacing={1.5}
          divider={<Divider flexItem />}
          sx={{ m: 0, p: 0 }}
          aria-labelledby={summaryId}
        >
          {thread.messages.map((message) => (
            <EmailMessageItem key={message.id} message={message} />
          ))}
        </Stack>
        <Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => onReply(thread)}>
          {t('Reply')}
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
