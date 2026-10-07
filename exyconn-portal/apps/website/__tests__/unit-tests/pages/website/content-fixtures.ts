import type {
  ListBlogPostsQuery,
  ListCaseStudiesQuery,
  ListJobCompaniesQuery,
  ListJobsQuery,
  ListToolsQuery,
  ListWebsiteSubmissionsPagedQuery,
} from '@exyconn/shell/graphql/generated';

type BlogRow = ListBlogPostsQuery['listBlogPosts'][number];
type CaseStudyRow = ListCaseStudiesQuery['listCaseStudies'][number];
type JobCompanyRow = ListJobCompaniesQuery['listJobCompanies'][number];
type JobRow = ListJobsQuery['listJobs'][number];
type ToolRow = ListToolsQuery['listTools'][number];
type SubmissionRow =
  ListWebsiteSubmissionsPagedQuery['listWebsiteSubmissionsPaged']['rows'][number];

export function blogRow(overrides: Partial<BlogRow> = {}): BlogRow {
  return {
    id: 'post-1',
    siteId: 'site-1',
    slug: 'scaling-graphql',
    title: 'Scaling GraphQL',
    summary: 'How we scaled it',
    content: '<p>Body</p>',
    contentCss: '',
    readTime: '5 min read',
    tags: ['graphql'],
    coverImage: '/images/cover.png',
    featured: false,
    isActive: true,
    publishedAt: '2026-03-01T00:00:00.000Z',
    author: { name: 'Ada Lovelace', role: 'Engineer', initials: 'AL' },
    ...overrides,
  };
}

export function caseStudyRow(overrides: Partial<CaseStudyRow> = {}): CaseStudyRow {
  return {
    id: 'case-1',
    siteId: 'site-1',
    slug: 'acme-migration',
    title: 'Acme migration',
    excerpt: 'Moving Acme to the cloud',
    content: '<p>Story</p>',
    contentCss: '',
    coverImage: 'https://cdn.exyconn.com/acme.png',
    category: 'Cloud',
    author: 'Grace Hopper',
    tags: ['cloud'],
    pdfUrl: 'https://cdn.exyconn.com/acme.pdf',
    featured: true,
    isActive: true,
    publishedAt: '2026-02-01T00:00:00.000Z',
    ...overrides,
  };
}

export function jobCompanyRow(overrides: Partial<JobCompanyRow> = {}): JobCompanyRow {
  return {
    id: 'company-1',
    siteId: 'site-1',
    companyCode: 'EXY',
    slug: 'exyconn',
    name: 'Exyconn',
    logo: '',
    tagline: '',
    description: '',
    culture: '',
    website: '',
    founded: '2020',
    employees: '50',
    industry: 'Software',
    headquarters: 'Remote',
    brandColor: '',
    secondaryColor: '',
    isActive: true,
    order: 1,
    benefits: [],
    socialLinks: { linkedin: '', twitter: '', facebook: '', instagram: '' },
    ...overrides,
  };
}

export function jobRow(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: 'job-1',
    siteId: 'site-1',
    jobCode: 'JOB-1',
    companySlug: 'exyconn',
    title: 'Frontend engineer',
    category: 'Engineering',
    skillSet: [],
    shortJobDescription: '',
    jobDescription: '',
    jobResponsibilities: '',
    requirements: [],
    niceToHave: [],
    benefits: [],
    location: 'Remote',
    jobType: 'Full Time',
    experienceLevel: 'Senior',
    workMode: 'Remote',
    salaryRange: '',
    jobPostDate: '2026-01-01T00:00:00.000Z',
    applicationDeadline: null,
    isActive: true,
    isFeatured: false,
    ...overrides,
  };
}

export function toolRow(overrides: Partial<ToolRow> = {}): ToolRow {
  return {
    id: 'tool-1',
    toolCode: 'JSON',
    categorySlug: 'developer',
    name: 'JSON formatter',
    description: '',
    longDescription: '',
    url: 'https://tools.exyconn.com/json',
    icon: '',
    color: '',
    features: [],
    useCases: [],
    keywords: [],
    isActive: true,
    isMVP: false,
    order: 1,
    ...overrides,
  };
}

export function submissionRow(overrides: Partial<SubmissionRow> = {}): SubmissionRow {
  return {
    id: 'sub-1',
    formType: 'contact',
    source: 'exyconn.com/contact',
    submissionData: { firstName: 'Asha', email: 'asha@example.com', subject: 'Pricing' },
    status: 'new',
    notes: '',
    leadId: null,
    applicantId: null,
    createdAt: '2026-05-01T10:00:00.000Z',
    ...overrides,
  };
}
