import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { DetailRow } from '@exyconn/shell/components/data/DetailRow';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { AppLogEventFieldsFragment } from '@exyconn/shell/graphql/generated';
import { CodeBlock } from './CodeBlock';

/** The breadcrumbs as one readable block: time, level, what the app was doing. */
function breadcrumbText(
  event: AppLogEventFieldsFragment,
  formatDateTime: (value: string) => string,
): string {
  return event.breadcrumbs
    .map((crumb) => [formatDateTime(crumb.at), crumb.level, crumb.message].join('  '))
    .join('\n');
}

/** Everything one occurrence carried: its stack, what led up to it, and where it ran. */
export function OccurrenceDetail({ event }: Readonly<{ event: AppLogEventFieldsFragment }>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  return (
    <Flex direction="column" spacing={2}>
      <Text size="sm">{event.message}</Text>
      <CodeBlock title={t('Stack')} text={event.stack} />
      <CodeBlock title={t('React component stack')} text={event.componentStack} />
      <CodeBlock
        title={t('What happened just before (oldest first)')}
        text={breadcrumbText(event, formatDateTime)}
      />
      <CodeBlock title={t('Context')} text={event.context} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
        <DetailRow label={t('Received')}>
          <Text size="sm">{formatDateTime(event.createdAt)}</Text>
        </DetailRow>
        <DetailRow label={t('Email')}>
          <Text size="sm">{event.userEmail || '—'}</Text>
        </DetailRow>
        <DetailRow label={t('Device ID')}>
          <Text size="sm">{event.deviceId || '—'}</Text>
        </DetailRow>
        <DetailRow label={t('Session')}>
          <Text size="sm">{event.sessionId || '—'}</Text>
        </DetailRow>
      </Box>
      <DetailRow label={t('User agent')}>
        <Text size="sm" sx={{ wordBreak: 'break-word' }}>
          {event.userAgent || '—'}
        </Text>
      </DetailRow>
    </Flex>
  );
}
