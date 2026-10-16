import { useT, useFormatters } from '@exyconn/i18n';
import { Box, Chip, Flex, Link, Text } from '@exyconn/shell/components/ui';
import type { CrmTimelineQuery } from '@exyconn/shell/graphql/generated';
import { AttachmentPreview } from './AttachmentPreview';
import { KIND_STYLES } from './timeline.kinds';

export type TimelineRow = CrmTimelineQuery['crmTimeline'][number];

/** One touchpoint: its kind, what happened, who and when, and any files it carries. */
export function TimelineEntry({ entry }: Readonly<{ entry: TimelineRow }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const style = KIND_STYLES[entry.kind];
  const by = entry.actor ? t('by {name}', { name: entry.actor }) : '';
  return (
    <Flex
      component="li"
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{ listStyle: 'none' }}
    >
      <Box
        aria-hidden
        sx={{
          color: `${style.color}.main`,
          bgcolor: 'action.hover',
          borderRadius: '50%',
          p: 0.5,
          display: 'flex',
        }}
      >
        {style.icon}
      </Box>
      <Flex direction="column" spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
        <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip size="small" label={t(style.label)} />
          {entry.url ? (
            <Link href={entry.url} underline="hover" sx={{ fontWeight: 600 }}>
              {entry.title}
            </Link>
          ) : (
            <Text weight="semibold">{entry.title}</Text>
          )}
          {entry.status && <Chip size="small" variant="outlined" label={entry.status} />}
        </Flex>
        {entry.summary && (
          <Text
            size="sm"
            color="text.secondary"
            sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}
          >
            {entry.summary}
          </Text>
        )}
        {entry.attachments.map((attachment) => (
          <AttachmentPreview key={attachment.url} attachment={attachment} />
        ))}
        <Text size="caption" color="text.secondary">
          <time dateTime={entry.at}>{formatDateTime(entry.at)}</time> {by}
        </Text>
      </Flex>
    </Flex>
  );
}
