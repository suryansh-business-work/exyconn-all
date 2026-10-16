import { useFormatters, useT } from '@exyconn/i18n';
import { Chip, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { CrmEmailDirection, type CrmEmailThreadsQuery } from '@exyconn/shell/graphql/generated';

export type EmailMessage = CrmEmailThreadsQuery['crmEmailThreads'][number]['messages'][number];

/** One message of a thread: who sent it to whom, when, and what it says (text only). */
export function EmailMessageItem({ message }: Readonly<{ message: EmailMessage }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const sent = message.direction === CrmEmailDirection.Out;
  const recipients = [...message.to, ...message.cc].join(', ');
  return (
    <Stack spacing={0.5} component="li" sx={{ listStyle: 'none' }}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          color={sent ? 'primary' : 'default'}
          label={sent ? t('Sent') : t('Received')}
        />
        <Text size="sm" weight="semibold" sx={{ overflowWrap: 'anywhere' }}>
          {message.from}
        </Text>
        <Text size="caption" color="text.secondary">
          <time dateTime={message.sentAt}>{formatDateTime(message.sentAt)}</time>
        </Text>
      </Flex>
      {recipients && (
        <Text size="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {t('To: {recipients}', { recipients })}
        </Text>
      )}
      <Text size="sm" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {message.bodyText || message.snippet}
      </Text>
    </Stack>
  );
}
