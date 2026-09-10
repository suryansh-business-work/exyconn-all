import type { ListCostCentersPagedQuery } from '@exyconn/shell/graphql/generated';

export type CostCenterRow = ListCostCentersPagedQuery['listCostCentersPaged']['rows'][number];
