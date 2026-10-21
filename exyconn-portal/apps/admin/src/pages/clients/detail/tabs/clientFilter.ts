import { FilterOp, type TableFilterInput } from '@exyconn/shell/graphql/generated';

/** The filter that narrows a shared paged list (invoices, payments, tickets…) to one client. */
export const clientFilter = (clientId: string): TableFilterInput[] => [
  { field: 'clientId', op: FilterOp.Equals, value: clientId },
];
