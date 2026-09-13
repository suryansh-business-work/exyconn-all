import { organizationService, type OrganizationAdminInput, type OrganizationInput } from './organizations.service';
import type { OrganizationStatus } from './organization.model';
import { assertAuthenticated, assertPlatformAdmin } from '../../middleware/roleGuard';
import { withId, withIds } from '../../utils/serialize';
import { organizationOf } from '../../lib/tenant';
import type { GraphQLContext } from '../../middleware/auth';

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
      return withId(await organizationService.create(input));
    },
    updateOrganization: async (
      _p: unknown,
      { id, input }: { id: string; input: Partial<OrganizationInput> },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      return withId(await organizationService.update(id, input));
    },
    setOrganizationStatus: async (
      _p: unknown,
      { id, status }: { id: string; status: OrganizationStatus },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      return withId(await organizationService.setStatus(id, status));
    },
    assignOrganizationAdmin: async (
      _p: unknown,
      { organizationId, input }: { organizationId: string; input: OrganizationAdminInput },
      ctx: GraphQLContext,
    ) => {
      assertPlatformAdmin(ctx);
      return withId(await organizationService.assignAdmin(organizationId, input));
    },
  },
  Organization: {
    /** Written before a field existed, a lean row comes back without it. */
    legalName: (organization: { legalName?: string | null }) => organization.legalName ?? '',
    country: (organization: { country?: string | null }) => organization.country ?? '',
    contactEmail: (organization: { contactEmail?: string | null }) => organization.contactEmail ?? '',
  },
  User: {
    /** Which company a person belongs to; null for a platform administrator. */
    organizationId: (user: object) => organizationOf(user),
  },
};
