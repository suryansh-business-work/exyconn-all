import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Chip, Flex, Stack, Text } from '@exyconn/shell/components/ui';
import { ListSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCrmTimelineQuery, type CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { KIND_FILTERS } from './timeline.kinds';
import { TimelineEntry } from './TimelineEntry';

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

  return (
    <Stack spacing={2}>
      {filters && (
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
      )}
      {loading && !data && (
        <ListSkeleton toolbar={false} rows={4} columns={3} label="Loading the activity" />
      )}
      {data && rows.length === 0 && (
        <Text color="text.secondary">{t('Nothing has happened with this record yet.')}</Text>
      )}
      <Stack component="ol" spacing={2} sx={{ p: 0, m: 0 }}>
        {rows.map((row) => (
          <TimelineEntry key={row.id} entry={row} />
        ))}
      </Stack>
    </Stack>
  );
}
