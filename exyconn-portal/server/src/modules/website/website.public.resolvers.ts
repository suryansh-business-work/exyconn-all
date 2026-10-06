import {
  BlogPostModel,
  CaseStudyModel,
  GigModel,
  JobCompanyModel,
  JobModel,
  NavLinkModel,
  ToolCategoryModel,
  ToolModel,
} from './models';
import { withId, withIds } from '../../utils/serialize';
import { siteIdsFor } from '../cms/cms.sites';

/**
 * Unauthenticated read API consumed by the public Astro website. Every query is
 * scoped to active records only — the portal's role-guarded `list*` queries are
 * what editors use to see drafts and archived content.
 */

type LeanDoc = { _id: unknown };

/**
 * What the public may see of dated content: active, and not dated in the future.
 *
 * `publishedAt` has always been on blog posts and case studies, and the site showed
 * everything active whatever that date said — so an editor could write next week's post,
 * set next week's date and publish it today by accident. Scheduling a post is now what
 * setting a future date means, which is what everybody assumed it already meant.
 */
const publishedBy = (now: Date) => ({ isActive: true, publishedAt: { $lte: now } });

type Site = { site?: string | null };

/** Records of one website (by slug; the default site when none is named). */
const ofSite = async ({ site }: Site) => ({ siteId: { $in: await siteIdsFor(site) } });

/** Serializes a nullable lean document, mapping `_id` onto `id`. */
function serializeOne<T extends LeanDoc>(doc: T | null): (T & { id: string }) | null {
  return doc ? withId(doc) : null;
}

export const websitePublicResolvers = {
  Query: {
    publicBlogPosts: async (_p?: unknown, args: Site = {}) =>
      withIds(
        (await BlogPostModel.find({ ...publishedBy(new Date()), ...(await ofSite(args)) })
          .sort({ publishedAt: -1 })
          .lean()) as LeanDoc[],
      ),

    publicBlogPost: async (_p: unknown, { slug, ...args }: { slug: string } & Site) =>
      serializeOne(
        (await BlogPostModel.findOne({
          slug,
          ...(await ofSite(args)),
          ...publishedBy(new Date()),
        }).lean()) as LeanDoc | null,
      ),

    publicCaseStudies: async (_p?: unknown, args: Site = {}) =>
      withIds(
        (await CaseStudyModel.find({ ...publishedBy(new Date()), ...(await ofSite(args)) })
          .sort({ publishedAt: -1 })
          .lean()) as LeanDoc[],
      ),

    publicCaseStudy: async (_p: unknown, { slug, ...args }: { slug: string } & Site) =>
      serializeOne(
        (await CaseStudyModel.findOne({
          slug,
          ...(await ofSite(args)),
          ...publishedBy(new Date()),
        }).lean()) as LeanDoc | null,
      ),

    publicJobCompanies: async (_p?: unknown, args: Site = {}) =>
      withIds(
        (await JobCompanyModel.find({ isActive: true, ...(await ofSite(args)) })
          .sort({ order: 1, name: 1 })
          .lean()) as LeanDoc[],
      ),

    publicJobCompany: async (_p: unknown, { slug, ...args }: { slug: string } & Site) =>
      serializeOne(
        (await JobCompanyModel.findOne({
          slug,
          isActive: true,
          ...(await ofSite(args)),
        }).lean()) as LeanDoc | null,
      ),

    publicJobs: async (_p: unknown, { companySlug, ...args }: { companySlug?: string } & Site) => {
      const base = { isActive: true, ...(await ofSite(args)) };
      const filter = companySlug ? { ...base, companySlug } : base;
      return withIds((await JobModel.find(filter).sort({ jobPostDate: -1 }).lean()) as LeanDoc[]);
    },

    publicJob: async (_p: unknown, { jobCode, ...args }: { jobCode: string } & Site) =>
      serializeOne(
        (await JobModel.findOne({
          jobCode,
          isActive: true,
          ...(await ofSite(args)),
        }).lean()) as LeanDoc | null,
      ),

    publicGigs: async (_p?: unknown, args: Site = {}) =>
      withIds(
        (await GigModel.find(await ofSite(args))
          .sort({ postedDate: -1 })
          .lean()) as LeanDoc[],
      ),

    publicGig: async (_p: unknown, { gigCode, ...args }: { gigCode: string } & Site) =>
      serializeOne(
        (await GigModel.findOne({ gigCode, ...(await ofSite(args)) }).lean()) as LeanDoc | null,
      ),

    publicToolCategories: async () =>
      withIds(
        (await ToolCategoryModel.find({ isActive: true }).sort({ order: 1 }).lean()) as LeanDoc[],
      ),

    publicTools: async (_p: unknown, { categorySlug }: { categorySlug?: string }) => {
      const filter = categorySlug ? { isActive: true, categorySlug } : { isActive: true };
      return withIds((await ToolModel.find(filter).sort({ order: 1 }).lean()) as LeanDoc[]);
    },

    publicTool: async (_p: unknown, { toolCode }: { toolCode: string }) =>
      serializeOne(
        (await ToolModel.findOne({ toolCode, isActive: true }).lean()) as LeanDoc | null,
      ),

    publicNavLinks: async (_p?: unknown, args: Site = {}) =>
      withIds(
        (await NavLinkModel.find({ isActive: true, ...(await ofSite(args)) })
          .sort({ order: 1 })
          .lean()) as LeanDoc[],
      ),
  },
};
