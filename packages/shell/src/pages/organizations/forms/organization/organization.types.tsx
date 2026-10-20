import type { OrganizationsQuery } from '@/graphql/generated';
import type { OrganizationValues } from './organization.schema';

export type OrganizationRow = OrganizationsQuery['organizations'][number];

export type OrganizationFormValues = OrganizationValues;
