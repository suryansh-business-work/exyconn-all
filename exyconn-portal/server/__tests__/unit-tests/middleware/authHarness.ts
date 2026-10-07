import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { buildContext, type GraphQLContext } from '../../../src/middleware/auth';
import { currentScope, runInScope, type TenantScope } from '../../../src/lib/tenant';
import { UserModel } from '../../../src/modules/admin/user.model';
import { OrganizationModel } from '../../../src/modules/organizations/organization.model';
import type { Role } from '../../../src/constants/roles';

interface RequestShape {
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, unknown>;
  ip?: string;
}

/** A request as Express hands it over, with only what buildContext reads. */
export function requestWith({ headers = {}, body, query = {}, ip }: RequestShape = {}): Request {
  return { headers, body, query, ip } as unknown as Request;
}

/** Builds the context inside a fresh request scope, and reports where that scope ended up. */
export function contextOf(req: Request): Promise<{ ctx: GraphQLContext; scope: TenantScope }> {
  return runInScope({ organizationId: null, platform: false }, async () => {
    const ctx = await buildContext({ req });
    return { ctx, scope: { ...(currentScope() as TenantScope) } };
  });
}

/** A company, open unless told otherwise. */
export async function seedCompany(slug: string, status = 'ACTIVE'): Promise<string> {
  const org = await OrganizationModel.create({ name: slug, slug, currency: 'USD', status });
  return String(org._id);
}

/** A person filed under a company (or none), with whatever account state the test needs. */
export async function seedPerson(
  organizationId: string | null,
  roles: Role[],
  extra: Record<string, unknown> = {},
) {
  return UserModel.create({
    name: 'Person',
    email: `${randomUUID()}@example.com`,
    passwordHash: randomUUID(),
    roles,
    organizationId,
    ...extra,
  });
}
