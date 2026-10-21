import { Link as RouterLink } from 'react-router-dom';
import { Link, Text } from '@exyconn/shell/components/ui';
import type { TimelineRow } from './TimelineEntry';
import { timelineItemHref } from './timelineItemHref';

interface TimelineTitleProps {
  row: Pick<TimelineRow, 'kind' | 'url' | 'title'>;
  /** Bold on the timeline; regular weight in the table. */
  strong?: boolean;
}

/** An entry's title, linked to what it tracks; plain text when it has no page. */
export function TimelineTitle({ row, strong = false }: Readonly<TimelineTitleProps>) {
  const href = timelineItemHref(row);
  const sx = { fontWeight: strong ? 600 : undefined, overflowWrap: 'anywhere' } as const;
  if (!href) {
    return strong ? (
      <Text weight="semibold" sx={sx}>
        {row.title}
      </Text>
    ) : (
      row.title
    );
  }
  if (href.startsWith('/')) {
    return (
      <Link component={RouterLink} to={href} underline="hover" sx={sx}>
        {row.title}
      </Link>
    );
  }
  return (
    <Link href={href} underline="hover" sx={sx}>
      {row.title}
    </Link>
  );
}
