import { z } from 'zod';
import { CampaignTemplateModel, CampaignTemplateVersionModel } from './campaign-template.model';
import { MarketingFooterModel } from './marketing-footer.model';
import {
  deleteTemplate,
  duplicateTemplate,
  restoreTemplateVersion,
  saveTemplate,
  techTemplates,
} from './campaign-template.service';
import { loadFooter } from './campaign.render';
import { preferencesByToken, updatePreferencesByToken } from './marketing.public';
import { actorOf } from './campaign.studio.resolvers';
import { recordAudit } from '../audit';
import { assertPermission } from '../../lib/permissions';
import { withId, withIds } from '../../utils/serialize';
import { badRequest } from '../../utils/errors';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';

const TEMPLATE_MODULE = 'CampaignTemplate';
const FOOTER_MODULE = 'MarketingFooter';

type Action = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE';
const guard = (ctx: GraphQLContext, module: string, action: Action) =>
  assertPermission(ctx, module, [ROLES.MARKETING], action);

const webAddress = z.union([z.literal(''), z.url({ protocol: /^https?$/ })]);
const hexColor = z.union([
  z.literal(''),
  z.string().regex(/^#[\da-f]{3,8}$/i, 'Use a hex colour like #2563eb.'),
]);

const footerSchema = z.object({
  companyName: z.string().trim().min(1, 'Add the company name.').max(120),
  contactLine: z.string().trim().max(200).default(''),
  postalAddress: z
    .string()
    .trim()
    .min(1, 'Add a postal address — marketing law requires one.')
    .max(300),
  privacyUrl: webAddress.default(''),
  websiteUrl: webAddress.default(''),
  textColor: hexColor.default(''),
  linkColor: hexColor.default(''),
});

const templateAudit = (ctx: GraphQLContext, id: unknown, name: string, summary: string) =>
  recordAudit(ctx, {
    action: 'UPDATE',
    module: TEMPLATE_MODULE,
    entityId: id,
    entityLabel: name,
    summary,
  });

export const campaignLibraryResolvers = {
  Query: {
    listCampaignTemplates: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, TEMPLATE_MODULE, 'VIEW');
      return withIds(await CampaignTemplateModel.find().sort({ category: 1, name: 1 }).lean());
    },
    campaignTemplateVersions: async (
      _p: unknown,
      { templateId }: { templateId: string },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, TEMPLATE_MODULE, 'VIEW');
      return withIds(
        await CampaignTemplateVersionModel.find({ templateId })
          .sort({ version: -1 })
          .select('version note createdByName createdAt')
          .lean(),
      );
    },
    techEmailTemplateOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, TEMPLATE_MODULE, 'VIEW');
      return techTemplates();
    },
    marketingFooter: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await guard(ctx, FOOTER_MODULE, 'VIEW');
      return loadFooter();
    },
    /** Public: the token is the credential. */
    emailPreferences: (_p: unknown, { token }: { token: string }) => preferencesByToken(token),
  },

  Mutation: {
    saveCampaignTemplate: async (
      _p: unknown,
      { id, input }: { id?: string | null; input: unknown },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, TEMPLATE_MODULE, id ? 'EDIT' : 'CREATE');
      const saved = await saveTemplate(id ?? null, input, (await actorOf(ctx)).name);
      await templateAudit(ctx, saved._id, saved.name, `Saved template version ${saved.version}`);
      return withId(saved as { _id: unknown });
    },
    duplicateCampaignTemplate: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, TEMPLATE_MODULE, 'CREATE');
      const copy = await duplicateTemplate(id, (await actorOf(ctx)).name);
      await templateAudit(ctx, copy._id, copy.name, 'Duplicated a template');
      return withId(copy as { _id: unknown });
    },
    restoreCampaignTemplateVersion: async (
      _p: unknown,
      { templateId, version }: { templateId: string; version: number },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, TEMPLATE_MODULE, 'EDIT');
      const restored = await restoreTemplateVersion(templateId, version, (await actorOf(ctx)).name);
      await templateAudit(ctx, templateId, restored.name, `Restored version ${version}`);
      return withId(restored as { _id: unknown });
    },
    deleteCampaignTemplate: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await guard(ctx, TEMPLATE_MODULE, 'DELETE');
      await deleteTemplate(id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: TEMPLATE_MODULE,
        entityId: id,
        summary: 'Deleted a template',
      });
      return true;
    },
    saveMarketingFooter: async (
      _p: unknown,
      { input }: { input: unknown },
      ctx: GraphQLContext,
    ) => {
      await guard(ctx, FOOTER_MODULE, 'EDIT');
      const parsed = footerSchema.safeParse(input);
      if (!parsed.success) {
        badRequest(parsed.error.issues[0].message);
      }
      await MarketingFooterModel.updateOne({}, { $set: parsed.data }, { upsert: true });
      await recordAudit(ctx, {
        action: 'SETTINGS',
        module: FOOTER_MODULE,
        summary: 'Saved the marketing email footer',
      });
      return loadFooter();
    },
    /** Public: the token is the credential; rate-limited per caller. */
    updateEmailPreferences: (
      _p: unknown,
      args: { token: string; optedOutCategoryIds: string[]; unsubscribeAll: boolean },
      ctx: GraphQLContext,
    ) =>
      updatePreferencesByToken(
        args.token,
        { optedOutCategoryIds: args.optedOutCategoryIds, unsubscribeAll: args.unsubscribeAll },
        ctx.ip ?? 'unknown',
      ),
  },
};
