import { assertPlatformStaff } from '../../lib/platformAccess';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { sslCertificates } from './ssl.service';
import { sonarService, type SonarConfigInput } from './sonar.service';

/** Security is a Tech screen; ADMIN passes every guard anyway. */
const techOnly = [ROLES.TECH];

/** Restricted under the same matrix row as the Tech module's other platform credentials. */
const TECH_MODULE = 'TechConfig';

/**
 * The hosts are the platform's own and the SonarQube token is the install's, so only the
 * platform operator's staff may see or change either (lib/platformAccess).
 */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, TECH_MODULE, techOnly, action);

interface RefreshArgs {
  refresh?: boolean | null;
}

export const securityResolvers = {
  Query: {
    sslCertificates: async (_p: unknown, { refresh }: RefreshArgs, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return sslCertificates(refresh ?? false);
    },
    listSonarConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withIds(await sonarService.listConfigs());
    },
    sonarOverview: async (_p: unknown, { refresh }: RefreshArgs, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return sonarService.overview(refresh ?? false);
    },
    sonarIssues: async (_p: unknown, { severity }: { severity: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return sonarService.issues(severity);
    },
  },
  Mutation: {
    createSonarConfig: async (
      _p: unknown,
      { input }: { input: SonarConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      return withId(await sonarService.createConfig(input));
    },
    updateSonarConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: SonarConfigInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return withId(await sonarService.updateConfig(id, input));
    },
    deleteSonarConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      return sonarService.deleteConfig(id);
    },
    testSonarConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'EDIT');
      return sonarService.testConnection(id);
    },
  },
};
