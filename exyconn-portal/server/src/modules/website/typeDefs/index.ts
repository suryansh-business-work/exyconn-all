import { blogTypeDefs } from './blog.typeDefs';
import { caseStudyTypeDefs } from './case-study.typeDefs';
import { jobCompanyTypeDefs } from './job-company.typeDefs';
import { jobTypeDefs } from './job.typeDefs';
import { gigTypeDefs } from './gig.typeDefs';
import { toolTypeDefs } from './tool.typeDefs';
import { navLinkTypeDefs } from './nav-link.typeDefs';
import { submissionTypeDefs } from './submission.typeDefs';
import { itemSeoTypeDefs } from './item-seo.typeDefs';

/** Spread into the root `typeDefs` array in graphql/index.ts. */
export const websiteTypeDefs = [
  itemSeoTypeDefs,
  blogTypeDefs,
  caseStudyTypeDefs,
  jobCompanyTypeDefs,
  jobTypeDefs,
  gigTypeDefs,
  toolTypeDefs,
  navLinkTypeDefs,
  submissionTypeDefs,
];
