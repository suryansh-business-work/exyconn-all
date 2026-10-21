import {
  organizationService,
  type OrganizationAdminInput,
  type OrganizationInput,
  type OrganizationMemberInput,
} from './organizations.service';
import { organizationHistory } from './organization.history';
import { diffChanges, recordAudit } from '../audit/audit.service';
import type { OrganizationStatus } from './organization.model';
import { assertAuthenticated, assertPlatformAdmin } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { organizationOf } from '../../lib/tenant';
import type { GraphQLContext } from '../../middleware/auth';

/** The audit module name every organization change is recorded under. */
const ORGANIZATION_MODULE = 'Organization';

/** The free-text details added after the first companies were created read '' on old rows. */
const DETAIL_FIELDS = [
  'website',
  'phone',
  'industry',
  'companySize',
  'registrationNumber',
  'taxId',
  'addressLine1',
  'addressLine2',
  'city',
  'region',
  'postalCode',
  'description',
] as const;

function detailDefaults() {
  return Object.fromEntries(
    DETAIL_FIELDS.map((field) => [
      field,
      (organization: Record<string, unknown>) => (organization[field] as string | undefined) ?? '',
    ]),
  );
}

/**
 * The platform's console over the tenancy: every organization, and who administers it.
 *
 * Every field here is SUPER_ADMIN except `myOrganization`, which is how a person's own
 * portal learns the company it is showing — its money, language, clock and name.
 */
export const organizationsResolvers = {
  Query: {
    organizations: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      return withIds(await organizationService.list());
    },
    organization: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      return withId(await organizationService.get(id));
    },
    organizationHistory: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertPlatformAdmin(ctx);
      return withIds(await organizationHistory(id));
    },
    myOrganization: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertAuthenticated(ctx);
      const organizationId = ctx.organizationId ?? null;
      if (organizationId === null) {
        return null;
      }
      return withId(await organizationService.get(organizationId));
    },
  },
  Mutation: {
    createOrganization: async (
      _p: unknown,
      { input }: { input: OrganizationInput },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const organization = await organizationService.create(input);
      await recordAudit(ctx, {
        action: 'CREATE',
        module: ORGANIZATION_MODULE,
        entityId: organization._id,
        entityLabel: organization.name,
        summary: `Created organization ${organization.name}`,
      });
      return withId(organization);
    },
    updateOrganization: async (
      _p: unknown,
      { id, input }: { id: string; input: Partial<OrganizationInput> },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const before = await organizationService.get(id);
      const organization = await organizationService.update(id, input);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: ORGANIZATION_MODULE,
        entityId: id,
        entityLabel: organization.name,
        summary: `Updated organization ${organization.name}`,
        changes: diffChanges(before, input),
      });
      return withId(organization);
    },
    setOrganizationStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: OrganizationStatus },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const organization = await organizationService.setStatus(id, status);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: ORGANIZATION_MODULE,
        entityId: id,
        entityLabel: organization.name,
        summary: `${status === 'SUSPENDED' ? 'Suspended' : 'Reactivated'} organization ${organization.name}`,
      });
      return withId(organization);
    },
    assignOrganizationAdmin: async (
      _p: unknown,
      { organizationId, input }: { organizationId: string; input: OrganizationAdminInput },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const user = await organizationService.assignAdmin(organizationId, input);
      await recordAudit(ctx, {
        action: 'ROLE_CHANGE',
        module: ORGANIZATION_MODULE,
        entityId: organizationId,
        entityLabel: user.email,
        summary: `Appointed ${user.email} as administrator`,
      });
      return withId(user);
    },
    inviteOrganizationMembers: async (
      _p: unknown,
      { organizationId, members }: { organizationId: string; members: OrganizationMemberInput[] },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      const users = await organizationService.inviteMembers(organizationId, members);
      // One independent audit row per invited person.
      await Promise.all(
        users.map((user) =>
          recordAudit(ctx, {
            action: 'CREATE',
            module: ORGANIZATION_MODULE,
            entityId: organizationId,
            entityLabel: user.email,
            summary: `Invited ${user.email} with ${user.roles.join(', ')}`,
          }),
        ),
      );
      return withIds(users);
    },
  },
  Organization: {
    ...detailDefaults(),
    /** Written before a field existed, a lean row comes back without it. */
    legalName: (organization: { legalName?: string | null }) => organization.legalName ?? '',
    country: (organization: { country?: string | null }) => organization.country ?? '',
    contactEmail: (organization: { contactEmail?: string | null }) =>
      organization.contactEmail ?? '',
    logoUrl: (organization: { logoUrl?: string | null }) => organization.logoUrl ?? '',
    isPlatformOperator: (organization: { isPlatformOperator?: boolean | null }) =>
      organization.isPlatformOperator === true,
  },
  User: {
    /** Which company a person belongs to; null for a platform administrator. */
    organizationId: (user: object) => organizationOf(user),
  },
};
