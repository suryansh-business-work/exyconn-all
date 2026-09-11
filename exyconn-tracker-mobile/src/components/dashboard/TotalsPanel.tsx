import { XStack, YStack } from 'tamagui';
import { useTotals } from '../../hooks/useTotals';
import { totalTiles } from '../../lib/dashboard/total-tiles';
import { capabilities } from '../../tracker/platform';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { SectionHeading } from './SectionHeading';
import { StatGrid } from './StatGrid';

interface Props {
  /** Changes when a sync lands — the only moment the all-time totals can have moved. */
  lastSyncAt: string | null;
}

const PLACEHOLDERS = ['a', 'b', 'c', 'd'] as const;

/** Placeholder tiles at the real grid's shape, so the panel does not jump when they land. */
function LoadingTiles() {
  return (
    <XStack
      flexWrap="wrap"
      gap="$3"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading your all-time totals"
    >
      {PLACEHOLDERS.map((id) => (
        <Surface key={id} height={76} flexGrow={1} flexBasis="40%" opacity={0.5} />
      ))}
    </XStack>
  );
}

/**
 * ALL TIME — the totals the portal holds for this employee, across every session and device.
 *
 * Deliberately a separate, labelled block from the live session tiles above it. An employee who
 * saw "Worked 0h 2m" right after signing in could not otherwise tell whether that meant "you
 * have worked two minutes today" or "everything you have ever logged is gone". Two headings,
 * two meanings, no ambiguity.
 */
export function TotalsPanel({ lastSyncAt }: Readonly<Props>) {
  const { totals, loading, error } = useTotals(lastSyncAt);

  return (
    <YStack gap="$3">
      <SectionHeading
        title="All time"
        caption="Everything you have tracked, across every session — it never resets."
      />
      {error === null ? null : <Notice severity="warning">{error}</Notice>}
      {loading && error === null ? <LoadingTiles /> : null}
      {totals === null ? null : <StatGrid tiles={totalTiles(totals, capabilities)} />}
    </YStack>
  );
}
