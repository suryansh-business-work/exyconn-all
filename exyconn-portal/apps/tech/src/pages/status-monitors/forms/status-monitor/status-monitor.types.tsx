import type { StatusMonitorFieldsFragment } from '@exyconn/shell/graphql/generated';

export type StatusMonitorRow = StatusMonitorFieldsFragment;

export interface StatusMonitorFormValues {
  key: string;
  name: string;
  description: string;
  category: string;
  url: string;
  isActive: boolean;
  order: number;
}
