import type { RequestType, MyRequestsQuery } from '@exyconn/shell/graphql/generated';

export type MyRequestRow = MyRequestsQuery['myRequests'][number];

export interface RaiseRequestFormValues {
  type: RequestType;
  subject: string;
  details: string;
}
