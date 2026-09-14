import type { OrganizationsQuery, OrganizationStatus } from '@exyconn/shell/graphql/generated';

export type OrganizationRow = OrganizationsQuery['organizations'][number];

export interface OrganizationFormValues {
  name: string;
  slug: string;
  legalName: string;
  country: string;
  currency: string;
  locale: string;
  timezone: string;
  fiscalYearStartMonth: number;
  contactEmail: string;
}

export type { OrganizationStatus };
