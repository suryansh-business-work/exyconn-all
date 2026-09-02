import type { ListLocationsPagedQuery } from '@exyconn/shell/graphql/generated';

export type LocationRow = ListLocationsPagedQuery['listLocationsPaged']['rows'][number];

export interface LocationFormValues {
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  address: string;
  active: string;
}
