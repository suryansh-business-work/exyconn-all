import { ROLES } from '../../constants/roles';
import { assertPlatformStaff } from '../../lib/platformAccess';
import type { GraphQLContext } from '../../middleware/auth';
import type { PermissionAction } from '../permissions/permission.model';
import { withId, withIds } from '../../utils/serialize';
import { billingKeys, type BillingKeyInput } from './billing/billing-keys.service';
import type { BillingProvider } from './billing/billing-key.model';
import { getFxRates } from './fx/fx.service';
import { integrationUsage } from './usage/usage.service';
import { callLog } from './usage/call-log.service';
import type { TableQueryInput } from '../../utils/tableQuery';
import { revealAllTechSecrets } from './tech.reveal';

/** Usage, cost and billing keys are the install's own infrastructure: platform staff with TECH. */
const guard = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

export const techUsageResolvers = {
  BillingKeyConfig: {
    hasKey: (row: { key?: string }) => Boolean(row.key),
    keyHint: (row: { keyHint?: string }) => row.keyHint || null,
  },
  Query: {
    integrationUsage: async (_p: unknown, { days }: { days: number }, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return integrationUsage(days);
    },
    listIntegrationCallsPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return callLog.page(input);
    },
    listIntegrationCallsStats: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return callLog.stats();
    },
    fxRates: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return getFxRates();
    },
    billingKeyConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, 'VIEW');
      return withIds(await billingKeys.list());
    },
    providerBilling: async (
      _p: unknown,
      { provider, days }: { provider: BillingProvider; days: number },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'VIEW');
      return billingKeys.bill(provider, days);
    },
  },
  Mutation: {
    createBillingKeyConfig: async (
      _p: unknown,
      { input }: { input: BillingKeyInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'CREATE');
      return withId(await billingKeys.create(input));
    },
    updateBillingKeyConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: BillingKeyInput },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, 'EDIT');
      return withId(await billingKeys.update(id, input));
    },
    deleteBillingKeyConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'DELETE');
      return billingKeys.remove(id);
    },
    testBillingKeyConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, 'EDIT');
      return billingKeys.test(id);
    },
    revealAllTechSecrets: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      revealAllTechSecrets(ctx),
  },
};
