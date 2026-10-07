import { OrganizationStatus, TaxSystem } from '@exyconn/shell/graphql/generated';
import type { OrganizationRow } from '../../../../src/pages/organizations/forms/organization';

/** A company as the Organizations query returns it. */
export const organization = (overrides: Partial<OrganizationRow> = {}): OrganizationRow => ({
  __typename: 'Organization',
  id: 'org-1',
  name: 'Acme',
  slug: 'acme',
  legalName: 'Acme Holdings Ltd',
  status: OrganizationStatus.Active,
  country: 'NO',
  currency: 'NOK',
  locale: 'nb',
  timezone: 'Europe/Oslo',
  fiscalYearStartMonth: 4,
  taxSystem: TaxSystem.None,
  contactEmail: 'ops@acme.example',
  logoUrl: 'https://cdn.example.com/acme.png',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});
