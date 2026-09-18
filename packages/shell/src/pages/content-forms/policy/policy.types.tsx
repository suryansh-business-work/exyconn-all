import type { PolicyFieldsFragment } from '@/graphql/generated';

export type PolicyRow = PolicyFieldsFragment;

export interface PolicyFormValues {
  title: string;
  slug: string;
  summary: string;
  body: string;
  audience: string;
  effectiveDate: string;
  requiresAcknowledgement: boolean;
  owner: string;
}
