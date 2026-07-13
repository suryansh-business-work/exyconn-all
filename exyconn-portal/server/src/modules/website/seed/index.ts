import type { Model } from 'mongoose';
import {
  BlogPostModel,
  CaseStudyModel,
  GigModel,
  JobCompanyModel,
  JobModel,
  NavLinkModel,
  ToolCategoryModel,
  ToolModel,
} from '../models';
import { logger } from '../../../utils/logger';
import { blogFixtures } from './fixtures/blog.fixtures';
import { caseStudyFixtures } from './fixtures/case-study.fixtures';
import { jobCompanyFixtures } from './fixtures/job-company.fixtures';
import { jobFixtures } from './fixtures/job.fixtures';
import { gigFixtures } from './fixtures/gig.fixtures';
import { toolCategoryFixtures, toolFixtures } from './fixtures/tool.fixtures';
import { navLinkFixtures } from './fixtures/nav-link.fixtures';

/**
 * One-time migration of the content that used to be hardcoded in the Astro website.
 *
 * Upserts with `$setOnInsert`, so re-running the seed never overwrites edits made by
 * an editor in the portal — each record is written once, keyed by its natural business
 * key (slug / jobCode / href / ...), and thereafter the database is the source of truth.
 */
async function seedCollection<T extends object>(
  model: Model<never>,
  naturalKey: keyof T & string,
  fixtures: T[],
  label: string,
): Promise<void> {
  const writable = model as unknown as Model<T>;
  let inserted = 0;

  for (const fixture of fixtures) {
    const result = await writable.updateOne(
      { [naturalKey]: fixture[naturalKey] } as never,
      { $setOnInsert: fixture as never },
      { upsert: true },
    );
    if (result.upsertedCount > 0) {
      inserted += 1;
    }
  }

  logger.info(
    `Website seed — ${label}: ${inserted} inserted, ${fixtures.length - inserted} existing`,
  );
}

export async function seedWebsiteContent(): Promise<void> {
  await seedCollection(BlogPostModel as never, 'slug', blogFixtures, 'blog posts');
  await seedCollection(CaseStudyModel as never, 'slug', caseStudyFixtures, 'case studies');
  await seedCollection(JobCompanyModel as never, 'slug', jobCompanyFixtures, 'job companies');
  await seedCollection(JobModel as never, 'jobCode', jobFixtures, 'jobs');
  await seedCollection(GigModel as never, 'gigCode', gigFixtures, 'gigs');
  await seedCollection(ToolCategoryModel as never, 'slug', toolCategoryFixtures, 'tool categories');
  await seedCollection(ToolModel as never, 'toolCode', toolFixtures, 'tools');
  await seedCollection(NavLinkModel as never, 'href', navLinkFixtures, 'nav links');
}
