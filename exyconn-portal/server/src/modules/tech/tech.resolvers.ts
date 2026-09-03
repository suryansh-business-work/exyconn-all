import { techService } from './tech.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { EmailConfigInput, ImageConfigInput, SlackConfigInput } from './tech.service';

const adminOnly = [ROLES.ADMIN];

export const techResolvers = {
  Query: {
    listEmailConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return withIds(await techService.listEmailConfigs());
    },
    listImageConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return withIds(await techService.listImageConfigs());
    },
    listSlackConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return withIds(await techService.listSlackConfigs());
    },
  },
  Mutation: {
    createEmailConfig: async (
      _p: unknown,
      { input }: { input: EmailConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.createEmailConfig(input));
    },
    updateEmailConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: EmailConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.updateEmailConfig(id, input));
    },
    deleteEmailConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return techService.deleteEmailConfig(id);
    },
    createImageConfig: async (
      _p: unknown,
      { input }: { input: ImageConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.createImageConfig(input));
    },
    updateImageConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: ImageConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.updateImageConfig(id, input));
    },
    deleteImageConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return techService.deleteImageConfig(id);
    },
    sendTestEmail: async (
      _p: unknown,
      { id, to }: { id: string; to: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return techService.sendTestEmail(id, to);
    },
    testImageUpload: async (
      _p: unknown,
      { id, file, fileName }: { id: string; file: string; fileName: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return techService.testImageUpload(id, file, fileName);
    },
    createSlackConfig: async (
      _p: unknown,
      { input }: { input: SlackConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.createSlackConfig(input));
    },
    updateSlackConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: SlackConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return withId(await techService.updateSlackConfig(id, input));
    },
    deleteSlackConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, adminOnly);
      return techService.deleteSlackConfig(id);
    },
    sendTestSlackMessage: async (
      _p: unknown,
      { id, channel }: { id: string; channel: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, adminOnly);
      return techService.sendTestSlackMessage(id, channel);
    },
  },
};
