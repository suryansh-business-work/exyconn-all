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
import { websiteTypeDefs } from './typeDefs';
import { websitePublicResolvers } from './website.public.resolvers';
import { websiteSubmissionResolvers } from './website.submissions.resolvers';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import type {
  BlogPostInput,
  CaseStudyInput,
  GigInput,
  JobCompanyInput,
  JobInput,
  NavLinkInput,
  ToolCategoryInput,
  ToolInput,
} from './website.inputs';

/**
 * One role per module, matching the portal's nav model — grant WEBSITE to anyone who
 * edits site content. ADMIN passes every guard. Keeping this to a single role means the
 * API guard and the UI route guard (`ProtectedRoute requiredRole={ROLES.WEBSITE}`) agree.
 */
const websiteRoles = { roles: [ROLES.WEBSITE] };

export const blogService = createCrudService<BlogPostInput>(BlogPostModel as never, 'BlogPost');
const blogResolvers = createCrudResolvers(blogService, {
  name: 'BlogPost',
  ...websiteRoles,
  table: {
    searchFields: ['slug', 'title', 'summary', 'content', 'readTime'],
    filterFields: ['slug', 'title', 'summary', 'content', 'readTime'],
    sortFields: ['slug', 'title', 'readTime', 'featured', 'isActive', 'publishedAt', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['featured', 'isActive'], unwindCountBy: ['tags'] },
});

export const caseStudyService = createCrudService<CaseStudyInput>(
  CaseStudyModel as never,
  'CaseStudy',
);
const caseStudyResolvers = createCrudResolvers(caseStudyService, {
  name: 'CaseStudy',
  plural: 'CaseStudies',
  ...websiteRoles,
  table: {
    searchFields: ['slug', 'title', 'excerpt', 'content', 'category', 'author'],
    filterFields: ['slug', 'title', 'excerpt', 'content', 'category', 'author'],
    sortFields: [
      'slug',
      'title',
      'category',
      'author',
      'featured',
      'isActive',
      'publishedAt',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['featured', 'isActive', 'category'] },
});

export const jobCompanyService = createCrudService<JobCompanyInput>(
  JobCompanyModel as never,
  'JobCompany',
);
const jobCompanyResolvers = createCrudResolvers(jobCompanyService, {
  name: 'JobCompany',
  plural: 'JobCompanies',
  ...websiteRoles,
  table: {
    searchFields: ['companyCode', 'slug', 'name', 'tagline', 'industry', 'headquarters'],
    filterFields: ['companyCode', 'slug', 'name', 'tagline', 'industry', 'headquarters'],
    sortFields: [
      'companyCode',
      'slug',
      'name',
      'industry',
      'headquarters',
      'isActive',
      'order',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['isActive', 'industry'], unwindCountBy: ['benefits'] },
});

export const jobService = createCrudService<JobInput>(JobModel as never, 'Job');
const jobResolvers = createCrudResolvers(jobService, {
  name: 'Job',
  ...websiteRoles,
  table: {
    searchFields: [
      'jobCode',
      'companySlug',
      'title',
      'category',
      'location',
      'salaryRange',
      'shortJobDescription',
    ],
    filterFields: [
      'jobCode',
      'companySlug',
      'title',
      'category',
      'location',
      'salaryRange',
      'jobType',
      'experienceLevel',
      'workMode',
    ],
    sortFields: [
      'jobCode',
      'companySlug',
      'title',
      'category',
      'jobType',
      'experienceLevel',
      'workMode',
      'location',
      'jobPostDate',
      'isActive',
      'isFeatured',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['isActive', 'isFeatured', 'companySlug'] },
});

export const gigService = createCrudService<GigInput>(GigModel as never, 'Gig');
const gigResolvers = createCrudResolvers(gigService, {
  name: 'Gig',
  ...websiteRoles,
  table: {
    searchFields: ['gigCode', 'title', 'category', 'shortDescription', 'budget'],
    filterFields: ['gigCode', 'title', 'category', 'budget', 'status', 'applicationType'],
    sortFields: [
      'gigCode',
      'title',
      'category',
      'budget',
      'duration',
      'status',
      'applicationType',
      'postedDate',
      'isUrgent',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'isUrgent', 'category'] },
});

export const toolCategoryService = createCrudService<ToolCategoryInput>(
  ToolCategoryModel as never,
  'ToolCategory',
);
const toolCategoryResolvers = createCrudResolvers(toolCategoryService, {
  name: 'ToolCategory',
  plural: 'ToolCategories',
  ...websiteRoles,
});

export const toolService = createCrudService<ToolInput>(ToolModel as never, 'Tool');
const toolResolvers = createCrudResolvers(toolService, {
  name: 'Tool',
  ...websiteRoles,
  table: {
    searchFields: ['toolCode', 'categorySlug', 'name', 'description'],
    filterFields: ['toolCode', 'categorySlug', 'name', 'description'],
    sortFields: ['toolCode', 'categorySlug', 'name', 'isActive', 'isMVP', 'order', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['isActive', 'isMVP', 'categorySlug'] },
});

export const navLinkService = createCrudService<NavLinkInput>(NavLinkModel as never, 'NavLink');
const navLinkResolvers = createCrudResolvers(navLinkService, { name: 'NavLink', ...websiteRoles });

/** Website CMS: typed CRUD per content entity + the public read API + form submissions. */
export const websiteResolvers = {
  Query: {
    ...blogResolvers.Query,
    ...caseStudyResolvers.Query,
    ...jobCompanyResolvers.Query,
    ...jobResolvers.Query,
    ...gigResolvers.Query,
    ...toolCategoryResolvers.Query,
    ...toolResolvers.Query,
    ...navLinkResolvers.Query,
    ...websiteSubmissionResolvers.Query,
    ...websitePublicResolvers.Query,
  },
  Mutation: {
    ...blogResolvers.Mutation,
    ...caseStudyResolvers.Mutation,
    ...jobCompanyResolvers.Mutation,
    ...jobResolvers.Mutation,
    ...gigResolvers.Mutation,
    ...toolCategoryResolvers.Mutation,
    ...toolResolvers.Mutation,
    ...navLinkResolvers.Mutation,
    ...websiteSubmissionResolvers.Mutation,
  },
};

export { websiteTypeDefs };
export * from './models';
