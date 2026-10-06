import type { GraphQLContext } from '../../../middleware/auth';
import { withId, withIds } from '../../../utils/serialize';
import { auditGateway, hasValue, hintOf, techGuard } from './gateway.access';
import {
  walletGatewayService,
  type PayoneerConfigInput,
  type PaypalConfigInput,
} from './gateway.wallets.service';

type Id = { id: string };

/** Tech > Environment Variables: Exyconn's PayPal and Payoneer accounts, audited like the others. */
export const walletGatewayResolvers = {
  Query: {
    listPaypalConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return withIds(await walletGatewayService.listPaypal());
    },
    listPayoneerConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return withIds(await walletGatewayService.listPayoneer());
    },
  },
  Mutation: {
    createPaypalConfig: async (
      _p: unknown,
      { input }: { input: PaypalConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'CREATE');
      const doc = await walletGatewayService.createPaypal(input);
      await auditGateway(ctx, `Added PayPal account ${input.label}`, doc._id);
      return withId(doc);
    },
    updatePaypalConfig: async (
      _p: unknown,
      { id, input }: Id & { input: PaypalConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'EDIT');
      const doc = await walletGatewayService.updatePaypal(id, input);
      await auditGateway(ctx, `Updated PayPal account ${input.label}`, id);
      return withId(doc);
    },
    deletePaypalConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'DELETE');
      await auditGateway(ctx, 'Deleted a PayPal account', id);
      return walletGatewayService.deletePaypal(id);
    },
    testPaypalConnection: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return walletGatewayService.testPaypal(id);
    },
    createPayoneerConfig: async (
      _p: unknown,
      { input }: { input: PayoneerConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'CREATE');
      const doc = await walletGatewayService.createPayoneer(input);
      await auditGateway(ctx, `Added Payoneer account ${input.label}`, doc._id);
      return withId(doc);
    },
    updatePayoneerConfig: async (
      _p: unknown,
      { id, input }: Id & { input: PayoneerConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techGuard(ctx, 'EDIT');
      const doc = await walletGatewayService.updatePayoneer(id, input);
      await auditGateway(ctx, `Updated Payoneer account ${input.label}`, id);
      return withId(doc);
    },
    deletePayoneerConfig: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'DELETE');
      await auditGateway(ctx, 'Deleted a Payoneer account', id);
      return walletGatewayService.deletePayoneer(id);
    },
    testPayoneerConnection: async (_p: unknown, { id }: Id, ctx: GraphQLContext) => {
      await techGuard(ctx, 'VIEW');
      return walletGatewayService.testPayoneer(id);
    },
  },
  PaypalConfig: {
    hasClientSecret: hasValue('clientSecret'),
    clientSecretHint: hintOf('clientSecretHint'),
  },
  PayoneerConfig: {
    hasApiToken: hasValue('apiToken'),
    apiTokenHint: hintOf('apiTokenHint'),
    division: (row: { division?: string | null }) => row.division ?? '',
  },
};
