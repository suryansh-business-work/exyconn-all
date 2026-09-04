import type { ReactElement } from 'react';
import { Alert, Box, Skeleton, Stack, Typography } from '@exyconn/ui';
import useTotals from '../hooks/useTotals';
import { totalTiles } from '../tiles';
import StatGrid from './StatGrid';

interface Props {
  /** Changes when a sync lands — the only moment the all-time totals can have moved. */
  lastSyncAt: string | null;
}

const SKELETONS = ['a', 'b', 'c', 'd'] as const;

/** Placeholder tiles at the real grid's shape, so the panel does not jump when they land. */
function LoadingTiles(): ReactElement {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 1.5,
      }}
    >
      {SKELETONS.map((id) => (
        <Skeleton key={id} variant="rounded" height={92} />
      ))}
    </Box>
  );
}

/**
 * ALL TIME — the totals the portal holds for this employee, across every session and device.
 *
 * Deliberately a separate, labelled block from the live session tiles above it. The dashboard
 * used to show only "this session", and an employee who saw "Worked 0h 2m" right after signing
 * in had no way to tell whether that meant "you have worked two minutes today" or "everything
 * you have ever logged is gone". Two headings, two meanings, no ambiguity.
 */
export default function TotalsPanel({ lastSyncAt }: Readonly<Props>): ReactElement {
  const { totals, loading, error } = useTotals(lastSyncAt);

  return (
    <Stack spacing={1}>
      <Stack spacing={0.25}>
        <Typography variant="subtitle2">All time</Typography>
        <Typography variant="caption" color="text.secondary">
          Everything you have tracked, across every session — it never resets.
        </Typography>
      </Stack>

      {error !== null ? (
        <Alert severity="warning" variant="outlined" sx={{ borderRadius: '4px' }}>
          {error}
        </Alert>
      ) : null}

      {loading && error === null ? <LoadingTiles /> : null}

      {totals !== null ? <StatGrid tiles={totalTiles(totals)} /> : null}
    </Stack>
  );
}
