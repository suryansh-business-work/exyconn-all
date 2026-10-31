import { useT } from '@exyconn/i18n';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Alert, Link, Stack, Text } from '@/components/ui';
import { StatusChip } from '@/components/data/StatusChip';
import { useSettings } from '@/hooks/useSettings';
import { useSupportTicketSourceQuery } from '@/graphql/generated';

/** Channels whose conversation lives outside the ticket, so the desk links to it. */
const LINKED_CHANNELS: ReadonlySet<string> = new Set(['CHAT', 'WHATSAPP']);

interface TicketSourceProps {
  ticketId: string;
  channel: string;
}

/**
 * The website chat or WhatsApp chat a ticket was opened by, read live from that channel — the
 * ticket links to the conversation rather than copying it. Renders nothing for a ticket whose
 * thread is the ticket itself (portal, email, agent).
 */
export function TicketSource({ ticketId, channel }: Readonly<TicketSourceProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const linked = LINKED_CHANNELS.has(channel);
  const { data, error } = useSupportTicketSourceQuery({
    variables: { ticketId },
    skip: !linked,
    fetchPolicy: 'cache-and-network',
  });

  if (!linked) {
    return null;
  }
  if (error) {
    return <Alert severity="warning">{t('The linked conversation could not be loaded.')}</Alert>;
  }
  const source = data?.supportTicketSource;
  if (!source) {
    return null;
  }
  const lastActivity = source.lastActivityAt ? formatDateTime(source.lastActivityAt) : '—';

  return (
    <Alert severity="info" icon={false}>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <StatusChip value={source.channel} />
          <StatusChip value={source.status} />
          <Text size="sm">{source.contact}</Text>
        </Stack>
        {source.detail && (
          <Text size="sm" color="text.secondary">
            {source.detail}
          </Text>
        )}
        <Text size="sm" color="text.secondary">
          {t('Last activity {date}', { date: lastActivity })}
        </Text>
        {source.url && (
          <Link href={source.url} target="_blank" rel="noopener noreferrer">
            <Stack direction="row" spacing={0.5} component="span" sx={{ alignItems: 'center' }}>
              <span>{t('Open the conversation')}</span>
              <OpenInNewIcon fontSize="inherit" />
            </Stack>
          </Link>
        )}
      </Stack>
    </Alert>
  );
}
