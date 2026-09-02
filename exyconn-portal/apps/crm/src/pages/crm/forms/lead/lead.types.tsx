import type { ListLeadsQuery, LeadSource, LeadStage } from '@exyconn/shell/graphql/generated';

export type LeadRow = ListLeadsQuery['listLeads'][number];

export interface LeadFormValues {
  name: string;
  email: string;
  source: LeadSource;
  stage: LeadStage;
  value: number;
  owner: string;
}
