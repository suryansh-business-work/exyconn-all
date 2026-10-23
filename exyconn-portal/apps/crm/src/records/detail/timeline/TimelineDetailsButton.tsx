import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import type { TimelineRow } from './TimelineEntry';
import { timelinePageHref } from './timelineItemHref';

interface TimelineDetailsButtonProps {
  row: TimelineRow;
  /** Opens the details dialog, for an entry without a page of its own. */
  onOpen: (row: TimelineRow) => void;
}

const SX = { alignSelf: 'flex-start', minWidth: 0, px: 0.5 } as const;

/**
 * "View details" on one entry: the entry's own page when it has one — inside the CRM through
 * the router, another portal by its address — and the details dialog otherwise.
 */
export function TimelineDetailsButton({ row, onOpen }: Readonly<TimelineDetailsButtonProps>) {
  const t = useT();
  const href = timelinePageHref(row);
  const label = t('View details of {title}', { title: row.title });
  if (href?.startsWith('/')) {
    return (
      <Button component={RouterLink} to={href} size="small" aria-label={label} sx={SX}>
        {t('View details')}
      </Button>
    );
  }
  if (href) {
    return (
      <Button href={href} size="small" aria-label={label} sx={SX}>
        {t('View details')}
      </Button>
    );
  }
  return (
    <Button
      size="small"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={() => onOpen(row)}
      sx={SX}
    >
      {t('View details')}
    </Button>
  );
}
