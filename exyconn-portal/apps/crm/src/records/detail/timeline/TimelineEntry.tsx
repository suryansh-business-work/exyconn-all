import { useT, useFormatters } from '@exyconn/i18n';
import {
  Chip,
  Flex,
  Text,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from '@exyconn/shell/components/ui';
import type { CrmTimelineQuery } from '@exyconn/shell/graphql/generated';
import { AttachmentPreview } from './AttachmentPreview';
import { TimelineDetailsButton } from './TimelineDetailsButton';
import { KIND_STYLES } from './timeline.kinds';
import { TimelineTitle } from './TimelineTitle';

export type TimelineRow = CrmTimelineQuery['crmTimeline'][number];

interface TimelineEntryProps {
  entry: TimelineRow;
  /** The oldest entry shown: no line runs on below its dot. */
  last: boolean;
  /** Opens the details dialog of an entry without a page of its own. */
  onViewDetails: (row: TimelineRow) => void;
}

/** One touchpoint: its kind, what happened, who and when, and any files it carries. */
export function TimelineEntry({ entry, last, onViewDetails }: Readonly<TimelineEntryProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const style = KIND_STYLES[entry.kind];
  const by = entry.actor ? t('by {name}', { name: entry.actor }) : '';
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot variant="outlined" color={style.color} aria-hidden>
          {style.icon}
        </TimelineDot>
        {!last && <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent sx={{ minWidth: 0, pb: 2 }}>
        <Flex direction="column" spacing={0.5}>
          <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="small" label={t(style.label)} />
            <TimelineTitle row={entry} strong />
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
          <TimelineDetailsButton row={entry} onOpen={onViewDetails} />
        </Flex>
      </TimelineContent>
    </TimelineItem>
  );
}
