import { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useMyOrganizationQuery } from '@/graphql/generated';
import { CURRENT_ORGANIZATION_SLUG, organizationLocation } from '@/config/organizationPath';

/**
 * Keeps the address on the company the API is actually showing.
 *
 * The API answers for the company the address names only when the caller may work in it (a
 * SUPER_ADMIN, and the company is open); otherwise it answers for the caller's own. Either way
 * `myOrganization` is the company in play, so an address without a company — or with one the
 * caller may not enter — is replaced by the same page under that company.
 */
export function OrganizationUrlSync() {
  const { user } = useAuth();
  const { data } = useMyOrganizationQuery({ skip: !user });
  const slug = data?.myOrganization?.slug;

  useEffect(() => {
    if (slug && slug !== CURRENT_ORGANIZATION_SLUG) {
      globalThis.location.replace(organizationLocation(slug));
    }
  }, [slug]);

  return null;
}
