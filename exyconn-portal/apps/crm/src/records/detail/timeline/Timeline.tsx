import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Chip,
  Flex,
  Stack,
  Text,
  Timeline as MuiTimeline,
  timelineItemClasses,
} from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCrmTimelineQuery, type CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { KIND_FILTERS } from './timeline.kinds';
import { TimelineEntry, type TimelineRow } from './TimelineEntry';
import { TimelineTable } from './TimelineTable';
import { TimelineViewToggle, useTimelineView } from './TimelineViewToggle';
import { TimelineDetailsDialog } from './TimelineDetailsDialog';

/**
 * Entries hang off the left rail: no opposite column taking half the width. MUI Lab draws that
 * column as each item's `::before` under `:not(:has(...))`, two classes deep and inserted after
 * this style, so the doubled `&&` is what outranks it.
 */
const RAIL_SX = {
  p: 0,
  m: 0,
  [`&& .${timelineItemClasses.root}::before`]: { flex: 0, p: 0 },
};

/** The entries on the rail, newest first, with the loading and empty states. */
interface TimelineListProps {
  rows: TimelineRow[];
  loading: boolean;
  onViewDetails: (row: TimelineRow) => void;
}

function TimelineList({ rows, loading, onViewDetails }: Readonly<TimelineListProps>) {
  const t = useT();
  if (loading) {
    return <ListSkeleton toolbar={false} rows={4} columns={3} label="Loading the activity" />;
  }
  if (rows.length === 0) {
    return <Text color="text.secondary">{t('Nothing has happened with this record yet.')}</Text>;
  }
  return (
    <MuiTimeline sx={RAIL_SX}>
      {rows.map((row, index) => (
        <TimelineEntry
          key={row.id}
          entry={row}
          last={index === rows.length - 1}
          onViewDetails={onViewDetails}
        />
      ))}
    </MuiTimeline>
  );
}

interface TimelineProps {
  object: CrmTimelineObject;
  id: string;
  /** Only the newest few, for the overview; the Activity tab shows everything with filters. */
  limit?: number;
  filters?: boolean;
}

/** Everything that happened with the contact or company, newest first. */
export function Timeline({ object, id, limit, filters = true }: Readonly<TimelineProps>) {
  const t = useT();
  const [filter, setFilter] = useState(KIND_FILTERS[0]);
  const [view, setView] = useTimelineView();
  const [viewing, setViewing] = useState<TimelineRow | null>(null);
  const { data, loading, error, refetch } = useCrmTimelineQuery({
    variables: { object, id, limit },
    fetchPolicy: 'cache-and-network',
  });
  const kinds = useMemo(() => new Set(filter.kinds), [filter]);
  const rows = (data?.crmTimeline ?? []).filter((row) => kinds.has(row.kind));

  if (error && !data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch().catch(() => undefined)}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the activity.'))}
      </Alert>
    );
  }

  const loadingFirst = loading && !data;
  const table = filters && view === 'table';
  return (
    <Stack spacing={2}>
      {filters && (
        <Flex
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          gap={1}
        >
          <Flex
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            role="group"
            aria-label={t('Show')}
          >
            {KIND_FILTERS.map((option) => (
              <Chip
                key={option.id}
                label={t(option.label)}
                color={option === filter ? 'primary' : 'default'}
                variant={option === filter ? 'filled' : 'outlined'}
                aria-pressed={option === filter}
                onClick={() => setFilter(option)}
              />
            ))}
          </Flex>
          <TimelineViewToggle view={view} onChange={setView} />
        </Flex>
      )}
      {table ? (
        <TimelineTable
          rows={rows}
          loading={loadingFirst}
          onRefresh={() => refetch()}
          onViewDetails={setViewing}
        />
      ) : (
        <TimelineList rows={rows} loading={loadingFirst} onViewDetails={setViewing} />
      )}
      <TimelineDetailsDialog
        object={object}
        recordId={id}
        row={viewing}
        onClose={() => setViewing(null)}
      />
    </Stack>
  );
}
