import type { Request } from 'express';
import { ROLES, type Role } from '../constants/roles';
import { runAsPlatform } from '../lib/tenant';
import { OrganizationModel } from '../modules/organizations/organization.model';

/**
 * The header a portal sends with the company its address names (`/organization/:slug/...`).
 * Only a platform administrator may work in a company other than their own; anyone else is
 * kept in their own, and the portal then moves its address back to that company.
 */
export const ORGANIZATION_HEADER = 'x-organization';

/** How long a handle's company is trusted before it is read again. */
const SLUG_TTL_MS = 60_000;
const slugCache = new Map<string, { at: number; id: string | null }>();

/** Test seam: forgets every cached handle. */
export function resetActingOrganizationCache(): void {
  slugCache.clear();
}

/** The ACTIVE company filed under this handle, or null. A suspended company cannot be entered. */
async function activeOrganizationId(slug: string): Promise<string | null> {
  const hit = slugCache.get(slug);
  if (hit && Date.now() - hit.at < SLUG_TTL_MS) {
    return hit.id;
  }
  const row = await runAsPlatform(() =>
    OrganizationModel.findOne({ slug, status: 'ACTIVE' }).select('_id').lean(),
  );
  const id = row ? String(row._id) : null;
  slugCache.set(slug, { at: Date.now(), id });
  return id;
}

/**
 * The company this request works in: the one the portal's address names when the caller is a
 * platform administrator and that company is open, otherwise the caller's own.
 */
export async function actingOrganization(
  req: Request,
  roles: readonly Role[],
  home: string | null,
): Promise<string | null> {
  const header = req.headers[ORGANIZATION_HEADER];
  const slug = typeof header === 'string' ? header.trim().toLowerCase() : '';
  if (slug === '' || !roles.includes(ROLES.SUPER_ADMIN)) {
    return home;
  }
  return (await activeOrganizationId(slug)) ?? home;
}
