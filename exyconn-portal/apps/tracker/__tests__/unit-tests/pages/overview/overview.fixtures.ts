import { PayType } from '@exyconn/shell/graphql/generated';
import type { TableRow } from './overview.stubs';

/** One employee's month on the billing report, at 40 an hour. */
export function billingRow(id: string, hours: number, rated = true): TableRow {
  return {
    __typename: 'TrackerBillingRow',
    id,
    name: `Employee ${id}`,
    email: `${id}@example.test`,
    payType: PayType.Hourly,
    currency: 'USD',
    billingRate: 40,
    hours,
    amount: hours * 40,
    rated,
  };
}

/** Ten employees, deliberately out of order, so the page has to rank and trim them. */
export const ROWS = [3.4, 12.6, 0.5, 7, 9.2, 1, 4, 30, 2.2, 5].map((hours, index) =>
  billingRow(`e${index}`, hours),
);
