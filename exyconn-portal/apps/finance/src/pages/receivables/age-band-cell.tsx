import { Chip, Text } from '@exyconn/shell/components/ui';
import type { ReceivablesQuery } from '@exyconn/shell/graphql/generated';

type ReceivablesBucket = ReceivablesQuery['receivables']['buckets'][number];

/**
 * A band as the table reads it. The band name doubles as the row id — it is already unique
 * and stable, so no index-as-key is needed.
 */
export type ReceivablesBand = ReceivablesBucket & { id: string };

/** Gives each band its row id, without the page reaching into the query shape. */
export function toBands(buckets: readonly ReceivablesBucket[]): ReceivablesBand[] {
  return buckets.map((bucket) => ({ ...bucket, id: bucket.band }));
}

interface AgeBandCellProps {
  label: string;
  late: boolean;
}

/**
 * One age band. Only the late ones are coloured — a report where everything is red says
 * nothing, and money that is simply not due yet is not a problem.
 */
export function AgeBandCell({ label, late }: Readonly<AgeBandCellProps>) {
  if (late) {
    return <Chip label={label} size="small" color="error" variant="outlined" />;
  }
  return (
    <Text size="sm" color="text.secondary">
      {label}
    </Text>
  );
}
