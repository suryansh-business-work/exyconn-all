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

/**
 * Unauthenticated read API consumed by the public Astro website. Every query is
 * scoped to active records only — the portal's role-guarded `list*` queries are
 * what editors use to see drafts and archived content.
 */

type LeanDoc = { _id: unknown };

/** Serializes a nullable lean document, mapping `_id` onto `id`. */
function serializeOne<T extends LeanDoc>(doc: T | null): (T & { id: string }) | null {
  return doc ? withId(doc) : null;
}

export const websitePublicResolvers = {
  Query: {
    publicBlogPosts: async () =>
      withIds(
        (await BlogPostModel.find({ isActive: true })
          .sort({ publishedAt: -1 })
          .lean()) as LeanDoc[],
      ),

    publicBlogPost: async (_p: unknown, { slug }: { slug: string }) =>
      serializeOne((await BlogPostModel.findOne({ slug, isActive: true }).lean()) as LeanDoc | null),

    publicCaseStudies: async () =>
      withIds(
        (await CaseStudyModel.find({ isActive: true })
          .sort({ publishedAt: -1 })
          .lean()) as LeanDoc[],
      ),

    publicCaseStudy: async (_p: unknown, { slug }: { slug: string }) =>
      serializeOne(
        (await CaseStudyModel.findOne({ slug, isActive: true }).lean()) as LeanDoc | null,
      ),

    publicJobCompanies: async () =>
      withIds(
        (await JobCompanyModel.find({ isActive: true })
          .sort({ order: 1, name: 1 })
          .lean()) as LeanDoc[],
      ),

    publicJobCompany: async (_p: unknown, { slug }: { slug: string }) =>
      serializeOne(
        (await JobCompanyModel.findOne({ slug, isActive: true }).lean()) as LeanDoc | null,
      ),

    publicJobs: async (_p: unknown, { companySlug }: { companySlug?: string }) => {
      const filter = companySlug ? { isActive: true, companySlug } : { isActive: true };
      return withIds(
        (await JobModel.find(filter).sort({ jobPostDate: -1 }).lean()) as LeanDoc[],
      );
    },

    publicJob: async (_p: unknown, { jobCode }: { jobCode: string }) =>
      serializeOne((await JobModel.findOne({ jobCode, isActive: true }).lean()) as LeanDoc | null),

    publicGigs: async () =>
      withIds((await GigModel.find().sort({ postedDate: -1 }).lean()) as LeanDoc[]),

    publicGig: async (_p: unknown, { gigCode }: { gigCode: string }) =>
      serializeOne((await GigModel.findOne({ gigCode }).lean()) as LeanDoc | null),

    publicToolCategories: async () =>
      withIds(
        (await ToolCategoryModel.find({ isActive: true }).sort({ order: 1 }).lean()) as LeanDoc[],
      ),

    publicTools: async (_p: unknown, { categorySlug }: { categorySlug?: string }) => {
      const filter = categorySlug ? { isActive: true, categorySlug } : { isActive: true };
      return withIds((await ToolModel.find(filter).sort({ order: 1 }).lean()) as LeanDoc[]);
    },

    publicTool: async (_p: unknown, { toolCode }: { toolCode: string }) =>
      serializeOne((await ToolModel.findOne({ toolCode, isActive: true }).lean()) as LeanDoc | null),

    publicNavLinks: async () =>
      withIds((await NavLinkModel.find({ isActive: true }).sort({ order: 1 }).lean()) as LeanDoc[]),
  },
};
