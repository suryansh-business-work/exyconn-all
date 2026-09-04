import { techService } from './tech.service';
import { assertAuthenticated, assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId, withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import type { PexelsSearchFilters } from '../../utils/pexels';
import type {
  EmailConfigInput,
  GithubConfigInput,
  ImageConfigInput,
  OpenAiConfigInput,
  PexelsConfigInput,
  SlackConfigInput,
  TrackerPlatform,
} from './tech.service';

/** The Tech module owns these screens; ADMIN passes every guard anyway. */
const techOnly = [ROLES.TECH];

/** Arguments both stock searches take: the term, the page and the dialog's filter row. */
interface PexelsSearchArgs {
  query: string;
  page?: number | null;
  filters?: PexelsSearchFilters | null;
}

/** Pexels pages one screenful at a time; page 1 is what the dialog opens on. */
const FIRST_PAGE = 1;

export const techResolvers = {
  Query: {
    listEmailConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listEmailConfigs());
    },
    listImageConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listImageConfigs());
    },
    listSlackConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listSlackConfigs());
    },
    listGithubConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listGithubConfigs());
    },
    listPexelsConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listPexelsConfigs());
    },
    listOpenAiConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return withIds(await techService.listOpenAiConfigs());
    },
    // The stock tabs live in the shared upload dialog, which every portal renders, so
    // these two are authenticated-only — the credential itself stays Tech-only above.
    searchPexelsPhotos: async (
      _p: unknown,
      { query, page, filters }: PexelsSearchArgs,
      ctx: GraphQLContext,
    ) => {
      assertAuthenticated(ctx);
      return techService.searchPexelsPhotos(query, page ?? FIRST_PAGE, filters ?? {});
    },
    searchPexelsVideos: async (
      _p: unknown,
      { query, page, filters }: PexelsSearchArgs,
      ctx: GraphQLContext,
    ) => {
      assertAuthenticated(ctx);
      return techService.searchPexelsVideos(query, page ?? FIRST_PAGE, filters ?? {});
    },
    listSlackChannels: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.listSlackChannels();
    },
    listTrackerBuilds: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.listTrackerBuilds();
    },
    trackerBuildSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.trackerBuildSettings();
    },
  },
  Mutation: {
    createEmailConfig: async (
      _p: unknown,
      { input }: { input: EmailConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createEmailConfig(input));
    },
    updateEmailConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: EmailConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updateEmailConfig(id, input));
    },
    deleteEmailConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deleteEmailConfig(id);
    },
    createImageConfig: async (
      _p: unknown,
      { input }: { input: ImageConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createImageConfig(input));
    },
    updateImageConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: ImageConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updateImageConfig(id, input));
    },
    deleteImageConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deleteImageConfig(id);
    },
    sendTestEmail: async (
      _p: unknown,
      { id, to }: { id: string; to: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return techService.sendTestEmail(id, to);
    },
    testImageUpload: async (
      _p: unknown,
      { id, file, fileName }: { id: string; file: string; fileName: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return techService.testImageUpload(id, file, fileName);
    },
    createSlackConfig: async (
      _p: unknown,
      { input }: { input: SlackConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createSlackConfig(input));
    },
    updateSlackConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: SlackConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updateSlackConfig(id, input));
    },
    deleteSlackConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deleteSlackConfig(id);
    },
    sendTestSlackMessage: async (
      _p: unknown,
      { id, channel }: { id: string; channel: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return techService.sendTestSlackMessage(id, channel);
    },
    createGithubConfig: async (
      _p: unknown,
      { input }: { input: GithubConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createGithubConfig(input));
    },
    updateGithubConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: GithubConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updateGithubConfig(id, input));
    },
    deleteGithubConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deleteGithubConfig(id);
    },
    testGithubConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.testGithubConnection(id);
    },
    createPexelsConfig: async (
      _p: unknown,
      { input }: { input: PexelsConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createPexelsConfig(input));
    },
    updatePexelsConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: PexelsConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updatePexelsConfig(id, input));
    },
    deletePexelsConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deletePexelsConfig(id);
    },
    testPexelsConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.testPexelsConnection(id);
    },
    createOpenAiConfig: async (
      _p: unknown,
      { input }: { input: OpenAiConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.createOpenAiConfig(input));
    },
    updateOpenAiConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: OpenAiConfigInput },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return withId(await techService.updateOpenAiConfig(id, input));
    },
    deleteOpenAiConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.deleteOpenAiConfig(id);
    },
    testOpenAiConnection: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      assertRole(ctx, techOnly);
      return techService.testOpenAiConnection(id);
    },
    startTrackerBuild: async (
      _p: unknown,
      { platforms, ref }: { platforms: TrackerPlatform[]; ref: string },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return techService.startTrackerBuild(platforms, ref);
    },
    saveTrackerBuildSettings: async (
      _p: unknown,
      { slackChannels }: { slackChannels: string[] },
      ctx: GraphQLContext,
    ) => {
      assertRole(ctx, techOnly);
      return techService.saveTrackerBuildSettings(slackChannels);
    },
  },
};
