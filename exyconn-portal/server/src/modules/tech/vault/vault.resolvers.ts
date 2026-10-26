import { ROLES } from '../../../constants/roles';
import { assertPlatformStaff } from '../../../lib/platformAccess';
import type { GraphQLContext } from '../../../middleware/auth';
import type { TableQueryInput } from '../../../utils/tableQuery';
import { recordAudit } from '../../audit';
import { vaultService, type UnlockInput } from './vault.service';

/** Only Tech staff may open the vault at all; opening it is what lets them change anything. */
const staff = (ctx: GraphQLContext) => assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], 'VIEW');

export const techVaultResolvers = {
  Query: {
    techVaultStatus: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await staff(ctx);
      return vaultService.status(ctx);
    },
    techVaultSessionsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await staff(ctx);
      return vaultService.history(input);
    },
    techVaultSessionActivity: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await staff(ctx);
      return vaultService.activity(id);
    },
  },
  Mutation: {
    requestTechVaultCode: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await staff(ctx);
      return vaultService.requestCode(ctx);
    },
    unlockTechVault: async (
      _p: unknown,
      { input }: { input: UnlockInput },
      ctx: GraphQLContext,
    ) => {
      await staff(ctx);
      const session = await vaultService.unlock(ctx, input);
      await recordAudit(ctx, {
        action: 'ACCESS',
        module: 'TechConfig',
        entityId: session.id,
        entityLabel: 'Environment Variables',
        summary: `Unlocked Environment Variables for 30 minutes: ${session.reason}`,
      });
      return session;
    },
    lockTechVault: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await staff(ctx);
      await recordAudit(ctx, {
        action: 'ACCESS',
        module: 'TechConfig',
        entityLabel: 'Environment Variables',
        summary: 'Locked Environment Variables',
      });
      return vaultService.lock(ctx);
    },
  },
};
