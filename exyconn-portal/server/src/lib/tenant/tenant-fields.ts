import { Types } from 'mongoose';
import { ORGANIZATION_FIELD } from './tenant-plugin';

/** A document with the organization the tenant plugin adds — invisible to TypeScript. */
type WithOrganization = { [ORGANIZATION_FIELD]?: Types.ObjectId | string | null };

/** The organization a document belongs to, or null for a platform record. */
export function organizationOf(doc: object): string | null {
  const value = (doc as WithOrganization)[ORGANIZATION_FIELD];
  return value === null || value === undefined ? null : String(value);
}

/** Moves a document into an organization. Writes inside a tenant scope are stamped anyway. */
export function setOrganizationOf(doc: object, organizationId: string): void {
  (doc as WithOrganization)[ORGANIZATION_FIELD] = new Types.ObjectId(organizationId);
}
