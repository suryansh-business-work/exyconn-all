import { CMS_COMPONENTS } from '@exyconn/cms';
import type { GraphQLContext } from '../../middleware/auth';
import { withId, withIds } from '../../utils/serialize';
import { cmsEditor } from './cms.access';
import { cmsAssets, type CmsAssetUpload } from './cms.assets';
import { cmsDesignSystems, type CmsDesignSystemInput } from './cms.design';
import type { CmsDraftInput } from './cms.documents';
import { cmsFragments, type CmsFragmentInput } from './cms.fragments';
import { cmsPages, type CmsPageListInput, type CmsPageSettingsInput } from './cms.pages';
import { signPreviewToken } from './cms.preview';
import { cmsSites, type CmsSiteInput } from './cms.sites';
import { setSiteARecord, siteDns } from './cms.dns';
import { googleFonts } from './cms.fonts';
import { recordAudit } from '../audit';

type Id = { id: string };
type Ctx = GraphQLContext;
type Lean = { _id: unknown };

const one = <T extends Lean | null>(doc: T) => (doc ? withId(doc as Lean) : doc);
const many = (docs: Lean[]) => withIds(docs);

/** Website › Websites, Pages, Fragments, Design System and Media, for the website team. */
export const cmsResolvers = {
  Query: {
    cmsSiteDns: async (_p: unknown, { siteId }: { siteId: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'VIEW');
      return siteDns(siteId);
    },
    cmsGoogleFonts: async (
      _p: unknown,
      a: { search?: string | null; category?: string | null; limit?: number | null },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'VIEW');
      return googleFonts(a.search, a.category, a.limit ?? undefined);
    },
    cmsSites: async (_p: unknown, _a: unknown, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'VIEW');
      return many(await cmsSites.list());
    },
    cmsSite: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'VIEW');
      return one(await cmsSites.get(id));
    },
    cmsSiteBySlug: async (_p: unknown, { slug }: { slug: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'VIEW');
      return one(await cmsSites.bySlug(slug));
    },
    cmsDesignSystems: async (_p: unknown, { siteId }: { siteId: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'VIEW');
      return many(await cmsDesignSystems.list(siteId));
    },
    cmsDesignSystem: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'VIEW');
      return one(await cmsDesignSystems.get(id));
    },
    cmsPages: async (
      _p: unknown,
      { siteId, input }: { siteId: string; input: CmsPageListInput },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsPage', 'VIEW');
      return cmsPages.paged(siteId, input);
    },
    cmsPage: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsPage', 'VIEW');
      return one(await cmsPages.get(id));
    },
    cmsPageRevisions: async (_p: unknown, { pageId }: { pageId: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsPage', 'VIEW');
      return many(await cmsPages.revisions(pageId));
    },
    cmsPreviewToken: async (_p: unknown, { pageId }: { pageId: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsPage', 'VIEW');
      await cmsPages.get(pageId);
      return signPreviewToken(pageId);
    },
    cmsFragments: async (_p: unknown, { siteId }: { siteId: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsFragment', 'VIEW');
      return many(await cmsFragments.list(siteId));
    },
    cmsFragment: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsFragment', 'VIEW');
      return one(await cmsFragments.get(id));
    },
    cmsAssets: async (
      _p: unknown,
      args: { siteId: string; page: number; pageSize: number; search?: string | null },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsAsset', 'VIEW');
      return cmsAssets.paged(args.siteId, args.page, args.pageSize, args.search);
    },
    cmsComponents: async (_p: unknown, _a: unknown, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsPage', 'VIEW');
      return CMS_COMPONENTS.map((component) => ({
        ...component,
        acceptsChildren: component.acceptsChildren ?? false,
      }));
    },
  },
  Mutation: {
    setCmsSiteARecord: async (
      _p: unknown,
      a: { siteId: string; domain: string; ip: string; ttl: number },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsSite', 'EDIT');
      const result = await setSiteARecord(a.siteId, a.domain, a.ip, a.ttl);
      await recordAudit(ctx, {
        action: 'UPDATE',
        module: 'CmsSite',
        entityId: a.siteId,
        summary: `Pointed ${a.domain} at ${a.ip} (A record, TTL ${a.ttl}s)`,
      });
      return result;
    },
    createCmsSite: async (_p: unknown, { input }: { input: CmsSiteInput }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'CREATE');
      return one(await cmsSites.create(input));
    },
    updateCmsSite: async (_p: unknown, { id, input }: Id & { input: CmsSiteInput }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'EDIT');
      return one(await cmsSites.update(id, input));
    },
    setDefaultCmsSite: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'EDIT');
      return one(await cmsSites.setDefault(id));
    },
    deleteCmsSite: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsSite', 'DELETE');
      return cmsSites.remove(id);
    },
    createCmsDesignSystem: async (
      _p: unknown,
      { input }: { input: CmsDesignSystemInput },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'CREATE');
      return one(await cmsDesignSystems.create(input));
    },
    updateCmsDesignSystem: async (
      _p: unknown,
      { id, input }: Id & { input: CmsDesignSystemInput },
      ctx: Ctx,
    ) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'EDIT');
      return one(await cmsDesignSystems.update(id, input));
    },
    deleteCmsDesignSystem: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsDesignSystem', 'DELETE');
      return cmsDesignSystems.remove(id);
    },
    createCmsPage: async (
      _p: unknown,
      { siteId, input }: { siteId: string; input: CmsPageSettingsInput },
      ctx: Ctx,
    ) => one(await cmsPages.create(siteId, input, await cmsEditor(ctx, 'CmsPage', 'CREATE'))),
    updateCmsPageSettings: async (
      _p: unknown,
      { id, input }: Id & { input: CmsPageSettingsInput },
      ctx: Ctx,
    ) => one(await cmsPages.updateSettings(id, input, await cmsEditor(ctx, 'CmsPage', 'EDIT'))),
    saveCmsPageDraft: async (_p: unknown, { id, draft }: Id & { draft: CmsDraftInput }, ctx: Ctx) =>
      one(await cmsPages.saveDraft(id, draft, await cmsEditor(ctx, 'CmsPage', 'EDIT'))),
    publishCmsPage: async (_p: unknown, { id }: Id, ctx: Ctx) =>
      one(await cmsPages.publish(id, await cmsEditor(ctx, 'CmsPage', 'APPROVE'))),
    unpublishCmsPage: async (_p: unknown, { id }: Id, ctx: Ctx) =>
      one(await cmsPages.unpublish(id, await cmsEditor(ctx, 'CmsPage', 'APPROVE'))),
    duplicateCmsPage: async (_p: unknown, { id, path }: Id & { path: string }, ctx: Ctx) =>
      one(await cmsPages.duplicate(id, path, await cmsEditor(ctx, 'CmsPage', 'CREATE'))),
    deleteCmsPage: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsPage', 'DELETE');
      return cmsPages.remove(id);
    },
    restoreCmsPageRevision: async (_p: unknown, { revisionId }: { revisionId: string }, ctx: Ctx) =>
      one(await cmsPages.restoreRevision(revisionId, await cmsEditor(ctx, 'CmsPage', 'EDIT'))),
    createCmsFragment: async (
      _p: unknown,
      { siteId, input }: { siteId: string; input: CmsFragmentInput },
      ctx: Ctx,
    ) =>
      one(await cmsFragments.create(siteId, input, await cmsEditor(ctx, 'CmsFragment', 'CREATE'))),
    updateCmsFragment: async (
      _p: unknown,
      { id, input }: Id & { input: CmsFragmentInput },
      ctx: Ctx,
    ) => one(await cmsFragments.update(id, input, await cmsEditor(ctx, 'CmsFragment', 'EDIT'))),
    saveCmsFragmentDraft: async (
      _p: unknown,
      { id, draft }: Id & { draft: CmsDraftInput },
      ctx: Ctx,
    ) => one(await cmsFragments.saveDraft(id, draft, await cmsEditor(ctx, 'CmsFragment', 'EDIT'))),
    publishCmsFragment: async (_p: unknown, { id }: Id, ctx: Ctx) =>
      one(await cmsFragments.publish(id, await cmsEditor(ctx, 'CmsFragment', 'APPROVE'))),
    deleteCmsFragment: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsFragment', 'DELETE');
      return cmsFragments.remove(id);
    },
    uploadCmsAsset: async (_p: unknown, { input }: { input: CmsAssetUpload }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsAsset', 'CREATE');
      return one(await cmsAssets.upload(input));
    },
    updateCmsAssetAlt: async (_p: unknown, { id, alt }: Id & { alt: string }, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsAsset', 'EDIT');
      return one(await cmsAssets.updateAlt(id, alt));
    },
    deleteCmsAsset: async (_p: unknown, { id }: Id, ctx: Ctx) => {
      await cmsEditor(ctx, 'CmsAsset', 'DELETE');
      return cmsAssets.remove(id);
    },
  },
};
