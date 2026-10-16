import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Card, Chip, Flex, Typography, fontWeight } from '@exyconn/shell/components/ui';
import PublicIcon from '@mui/icons-material/Public';
import { formatWith } from '@exyconn/shell/utils/date';
import { sanitizeRichHtml } from '@exyconn/shell/utils/sanitizeHtml';
import { humanize } from '@exyconn/shell/components/work/work-arrangement';
import { DetailSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { usePublicTaskQuery } from '@exyconn/shell/graphql/generated';
import { DATE_FORMAT } from '../../status.constants';
import { LinkExpiredCard } from '../../components/LinkExpiredCard';
import { SharedProjectFacts } from '../project';

/**
 * A ticket somebody made public, opened from its public link — read-only, with no sign-in.
 *
 * It lives on the status site for the same reason a project share does: the reader has no
 * portal account. Everything shown is what the server put in `publicTask`; the comments,
 * history and files that sit under the ticket in the portal never reach this page.
 */
export function PublicTicketPage() {
  const t = useT();
  const { token = '' } = useParams();
  const { data, loading } = usePublicTaskQuery({
    variables: { token },
    skip: token === '',
    fetchPolicy: 'network-only',
  });

  if (loading) {
    return <DetailSkeleton aside={false} tabs={false} />;
  }

  const ticket = data?.publicTask;
  if (!ticket) {
    return <LinkExpiredCard />;
  }

  const facts = [
    { label: 'Status', value: ticket.status || '—' },
    { label: 'Assignee', value: ticket.assigneeName || t('Unassigned') },
    { label: 'Due', value: ticket.dueDate ? formatWith(ticket.dueDate, DATE_FORMAT) : '—' },
    { label: 'Updated', value: formatWith(ticket.updatedAt, DATE_FORMAT) },
  ];

  return (
    <Flex direction="column" spacing={3}>
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {ticket.projectName}
        </Typography>
        <Flex alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, my: 0.5 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: fontWeight.bold }}>
            {ticket.key}
          </Typography>
          <Chip size="small" label={t(humanize(ticket.type))} />
          <Chip size="small" variant="outlined" label={t(humanize(ticket.priority))} />
          {ticket.isDone ? <Chip size="small" color="success" label={t('Done')} /> : null}
        </Flex>
        <Typography variant="h4" component="h1" sx={{ fontWeight: fontWeight.bold }}>
          {ticket.title}
        </Typography>
      </Box>

      <Alert severity="info" icon={<PublicIcon />}>
        {t(
          'Shared publicly, read-only. Anyone with this link can see it; the conversation and files around it stay private.',
        )}
      </Alert>

      <SharedProjectFacts facts={facts} />

      {ticket.labels.length > 0 ? (
        <Flex spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          {ticket.labels.map((label) => (
            <Chip key={label} size="small" variant="outlined" label={label} />
          ))}
        </Flex>
      ) : null}

      {ticket.description ? (
        <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Box
            sx={(theme) => ({
              overflowWrap: 'anywhere',
              '& img': { maxWidth: '100%' },
              '& a': { color: theme.palette.primary.main, textDecoration: 'underline' },
            })}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(ticket.description) }}
          />
        </Card>
      ) : null}
    </Flex>
  );
}
