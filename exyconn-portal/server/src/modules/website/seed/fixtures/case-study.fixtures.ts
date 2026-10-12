/**
 * Case study seed data, migrated verbatim from the Astro website
 * (`exyconn-website/src/pages/case-studies/data.ts`).
 *
 * The source records were keyed by a numeric `id` only and had no slug, so each `slug`
 * below was generated from the title (lowercased, non-alphanumeric runs collapsed to a
 * single `-`, leading/trailing `-` trimmed) and is written out as a literal. The numeric
 * `id` is dropped — the database assigns its own. `featured` mirrors the website index
 * page, which showed the first four entries as featured.
 *
 * The records themselves are data (case-studies.json beside this module), with `publishedAt`
 * as a calendar date.
 */

import type { CaseStudyInput } from '../../website.inputs';
import caseStudies from './case-studies.json';

export const caseStudyFixtures: CaseStudyInput[] = caseStudies.map((caseStudy) => ({
  ...caseStudy,
  publishedAt: new Date(caseStudy.publishedAt),
}));
