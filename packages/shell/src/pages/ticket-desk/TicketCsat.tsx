import { useT } from '@exyconn/i18n';
import { Text } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';

interface TicketCsatProps {
  csatSentAt?: string | null;
  csatScore?: number | null;
  csatComment?: string | null;
}

/**
 * How the customer rated the ticket, or that the survey is still out. Nothing before a survey
 * was sent: employee tickets and unresolved customer tickets have no satisfaction to show.
 */
export function TicketCsat({ csatSentAt, csatScore, csatComment }: Readonly<TicketCsatProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  if (!csatSentAt) {
    return null;
  }
  if (csatScore == null) {
    return (
      <Text size="sm" color="text.secondary">
        {t('Satisfaction survey sent {date}, not answered yet', {
          date: formatDateTime(csatSentAt),
        })}
      </Text>
    );
  }
  return (
    <Text size="sm">
      {t('Customer rated this {score} out of 5', { score: csatScore })}
      {csatComment ? ` — “${csatComment}”` : ''}
    </Text>
  );
}
