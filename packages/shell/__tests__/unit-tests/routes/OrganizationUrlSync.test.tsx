import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import type { MockLink } from '@apollo/client/testing';
import { MyOrganizationDocument, OrganizationStatus, TaxSystem } from '@/graphql/generated';
import { OrganizationUrlSync } from '@/routes/OrganizationUrlSync';
import { makeUser, renderWithProviders } from '../test-utils';

/** The company the page was loaded for; the module reads it once, at import. */
const page = vi.hoisted(() => ({ slug: null as string | null }));

vi.mock('@/config/organizationPath', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/config/organizationPath')>();
  return {
    ...actual,
    get CURRENT_ORGANIZATION_SLUG() {
      return page.slug;
    },
    organizationLocation: (slug: string) => `/organization/${slug}/hr/leave`,
  };
});

/** The MyOrganization answer, plus a spy on it so a test can tell whether it was asked. */
function organizationMock(slug: string | null) {
  const organization = slug && {
    __typename: 'Organization',
    id: 'org-1',
    name: 'Acme',
    slug,
    legalName: 'Acme Pvt Ltd',
    status: OrganizationStatus.Active,
    country: 'IN',
    currency: 'INR',
    locale: 'en',
    timezone: 'Asia/Kolkata',
    fiscalYearStartMonth: 4,
    taxSystem: TaxSystem.None,
    contactEmail: 'ops@acme.test',
    logoUrl: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const result = vi.fn(() => ({ data: { myOrganization: organization } }));
  const mock: MockLink.MockedResponse = { request: { query: MyOrganizationDocument }, result };
  return { mock, result };
}

const replace = vi.fn();

describe('OrganizationUrlSync', () => {
  beforeEach(() => {
    page.slug = null;
    replace.mockReset();
    vi.stubGlobal('location', { ...globalThis.location, replace });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('moves an address without a company onto the company the API is showing', async () => {
    renderWithProviders(<OrganizationUrlSync />, {
      user: makeUser(),
      mocks: [organizationMock('acme').mock],
    });

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/organization/acme/hr/leave'));
  });

  it('leaves an address that already names that company alone', async () => {
    page.slug = 'acme';
    const { mock, result } = organizationMock('acme');
    renderWithProviders(<OrganizationUrlSync />, { user: makeUser(), mocks: [mock] });

    await waitFor(() => expect(result).toHaveBeenCalled());
    await new Promise((done) => setTimeout(done, 0));
    expect(replace).not.toHaveBeenCalled();
  });

  it('does nothing when the API names no company', async () => {
    const { mock, result } = organizationMock(null);
    renderWithProviders(<OrganizationUrlSync />, { user: makeUser(), mocks: [mock] });

    await waitFor(() => expect(result).toHaveBeenCalled());
    await new Promise((done) => setTimeout(done, 0));
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not ask while signed out', async () => {
    const { mock, result } = organizationMock('acme');
    renderWithProviders(<OrganizationUrlSync />, { user: null, mocks: [mock] });

    await new Promise((done) => setTimeout(done, 10));
    expect(result).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
