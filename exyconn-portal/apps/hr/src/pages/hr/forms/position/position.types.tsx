import type { ListPositionsQuery } from '@exyconn/shell/graphql/generated';

export type PositionRow = ListPositionsQuery['listPositions'][number];

export interface PositionFormValues {
  name: string;
  department: string;
  description: string;
}
