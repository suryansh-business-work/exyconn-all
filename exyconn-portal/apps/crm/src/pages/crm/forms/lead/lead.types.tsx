import type { ListLeadsQuery, LeadSource, LeadStage } from '@exyconn/shell/graphql/generated';
import type { CustomFormValues } from '../../../../records/custom-fields';

/**
 * A lead as the form edits it. `custom` is there on rows from the search query; a row from an
 * older query without it starts with no custom values.
 */
export type LeadRow = ListLeadsQuery['listLeads'][number] & { custom?: unknown };

export interface LeadFormValues {
  name: string;
  email: string;
  source: LeadSource;
  stage: LeadStage;
  value: number;
  owner: string;
  campaignId: string;
  custom: CustomFormValues;
}
