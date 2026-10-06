import type { CmsComponentDef } from './types';
import { CAREER_GIGS_PROPS, CAREER_INDEX_PROPS } from './career.copy';
import { CAREER_COMPANY_PROPS, CAREER_GIG_PROPS, CAREER_JOB_PROPS } from './career.copy-detail';

/** The careers pages: the index, the gigs board and the gig, company and role templates. */
export const CAREER_COMPONENTS = [
  {
    key: 'career.index',
    label: 'Careers index',
    category: 'Collections',
    description:
      "The careers band and live counts, this site's open roles, the companies hiring, a few open gigs, why join, how hiring works, the FAQ and the call to action.",
    defaultProps: CAREER_INDEX_PROPS,
  },
  {
    key: 'career.gigs',
    label: 'Freelance gigs board',
    category: 'Collections',
    description:
      "The gigs band and live counts, the filterable list of this site's open gigs (or the empty state), the freelance perks and the call to action.",
    defaultProps: CAREER_GIGS_PROPS,
  },
  {
    key: 'career.gig',
    label: 'Freelance gig',
    category: 'Collections',
    description:
      'One gig, for the /career/gig/:gigId template (the gig code): its brief, the apply panel and more open gigs. An unknown code is a 404.',
    defaultProps: CAREER_GIG_PROPS,
  },
  {
    key: 'career.company',
    label: 'Company careers',
    category: 'Collections',
    description:
      'One company, for the /career/company/:companySlug template: about, culture, benefits, its open roles and the call to action. An unknown company is a 404.',
    defaultProps: CAREER_COMPANY_PROPS,
  },
  {
    key: 'career.job',
    label: 'Job opening',
    category: 'Collections',
    description:
      "One role, for the /career/company/:companySlug/job/:jobId template (the job code): the role, the apply panel, the application form and the company's other roles. A role of another company is a 404.",
    defaultProps: CAREER_JOB_PROPS,
  },
] as const satisfies readonly CmsComponentDef[];
