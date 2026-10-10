import { runAsPlatform } from '../../lib/tenant';
import { logger } from '../../utils/logger';
import { BlogPostModel } from '../website/models/blog.model';
import { CaseStudyModel } from '../website/models/case-study.model';
import { GigModel } from '../website/models/gig.model';
import { JobCompanyModel } from '../website/models/job-company.model';
import { JobModel } from '../website/models/job.model';
import { NavLinkModel } from '../website/models/nav-link.model';
import { runOnce } from '../../lib/migrations';
import {
  CmsDesignSystemModel,
  CmsFragmentModel,
  CmsPageModel,
  CmsSiteModel,
  type CmsSiteDocument,
} from './models';
import { compileDraft } from './cms.documents';
import { EXYCONN_SEED } from './seed/exyconn';
import type { CmsSiteSeed } from './seed/types';

const SEED_FRAGMENT = /data-fragment-id="seed:([\w-]+)"/g;

type SiteRow = CmsSiteDocument & { _id: unknown };

/** The seed's site, created on first boot (as the default site when there is none yet). */
async function ensureSite(seed: CmsSiteSeed): Promise<SiteRow> {
  const existing = await CmsSiteModel.findOne({ slug: seed.site.slug }).lean();
  if (existing) {
    return existing;
  }
  const hasDefault = await CmsSiteModel.exists({ isDefault: true });
  const { name, slug, domains, markets, defaultLocale, faviconUrl, seo } = seed.site;
  const site = await CmsSiteModel.create({
    name,
    slug,
    domains,
    markets,
    defaultLocale,
    faviconUrl,
    seo,
    headHtml: seed.site.headHtml,
    bodyEndHtml: seed.site.bodyEndHtml,
    globalCss: seed.site.globalCss,
    status: 'ACTIVE',
    isDefault: !hasDefault,
  });
  logger.info(`CMS site ${seed.site.slug} created`);
  return site.toObject();
}

/** Seed fragment keys → real ids, for the fragments this site already has. */
async function fragmentIds(siteId: string): Promise<Map<string, string>> {
  const rows = await CmsFragmentModel.find({ siteId, seedKey: { $ne: '' } })
    .select('seedKey')
    .lean();
  return new Map(rows.map((row) => [row.seedKey, String(row._id)]));
}

const withFragmentIds = (html: string, ids: Map<string, string>) =>
  html.replaceAll(SEED_FRAGMENT, (whole, key: string) => {
    const id = ids.get(key);
    return id ? `data-fragment-id="${id}"` : whole;
  });

/** A draft compiled and put live, as an editor pressing Publish would. */
async function published(siteId: string, html: string, css: string, selfId?: string) {
  const compiled = await compileDraft({ html, css }, siteId, selfId);
  return { blocks: compiled.blocks, css: compiled.css, publishedAt: new Date() };
}

async function seedFragments(seed: CmsSiteSeed, siteId: string, done: Set<string>) {
  for (const fragment of seed.fragments) {
    const key = `fragment:${fragment.key}`;
    if (done.has(key)) continue;
    const ids = await fragmentIds(siteId);
    const html = withFragmentIds(fragment.html, ids);
    const row = await CmsFragmentModel.create({
      siteId,
      name: fragment.name,
      kind: fragment.kind,
      seedKey: fragment.key,
      draft: { projectData: null, html, css: fragment.css },
      status: 'PUBLISHED',
      published: await published(siteId, html, fragment.css),
      updatedByName: 'Seed',
    });
    done.add(key);
    logger.info(`CMS fragment ${fragment.key} seeded (${row._id.toHexString()})`);
  }
}

async function seedPages(seed: CmsSiteSeed, siteId: string, done: Set<string>) {
  const ids = await fragmentIds(siteId);
  for (const page of seed.pages) {
    const key = `page:${page.key}`;
    if (done.has(key) || (await CmsPageModel.exists({ siteId, path: page.path }))) {
      done.add(key);
      continue;
    }
    const html = withFragmentIds(page.html, ids);
    await CmsPageModel.create({
      siteId,
      path: page.path,
      kind: page.kind,
      title: page.title,
      layout: page.layout,
      seo: page.seo,
      seedKey: page.key,
      draft: { projectData: null, html, css: page.css },
      status: 'PUBLISHED',
      published: await published(siteId, html, page.css),
      updatedByName: 'Seed',
    });
    done.add(key);
  }
}

/**
 * Inserts what a site's seed holds and the site does not have yet — insert-only, and each item
 * once (the site remembers the keys it was seeded with), so an editor's change or deletion is
 * never undone, while a page added to the seed in a later release still arrives.
 */
async function seedSite(seed: CmsSiteSeed): Promise<void> {
  const site = await ensureSite(seed);
  const siteId = String(site._id);
  const done = new Set(site.seededKeys ?? []);
  const update: Record<string, string> = {};
  if (!site.designSystemId) {
    const design = await CmsDesignSystemModel.create({ siteId, ...seed.designSystem });
    update.designSystemId = design._id.toHexString();
  }
  await seedFragments(seed, siteId, done);
  const ids = await fragmentIds(siteId);
  const headerId = ids.get(seed.site.headerFragment);
  if (!site.headerFragmentId && headerId) {
    update.headerFragmentId = headerId;
  }
  const footerId = ids.get(seed.site.footerFragment);
  if (!site.footerFragmentId && footerId) {
    update.footerFragmentId = footerId;
  }
  await seedPages(seed, siteId, done);
  await CmsSiteModel.updateOne({ _id: siteId }, { ...update, seededKeys: [...done] });
}

/** Files every website record from before the CMS under the default site. */
async function assignDefaultSite(): Promise<void> {
  const site = await CmsSiteModel.findOne({ isDefault: true }).select('_id').lean();
  if (!site) return;
  const siteId = String(site._id);
  const unassigned = { siteId: { $in: ['', null] } };
  for (const model of [
    BlogPostModel,
    CaseStudyModel,
    JobModel,
    JobCompanyModel,
    GigModel,
    NavLinkModel,
  ]) {
    await (model as typeof BlogPostModel).updateMany(unassigned, { siteId });
  }
}

/**
 * Boot: exyconn.com and everything it had before the CMS, then every older website record
 * filed under it. Platform-wide (Exyconn's own sites), so it runs once for the install.
 */
export async function ensureCmsDefaults(): Promise<void> {
  await runAsPlatform(async () => {
    await seedSite(EXYCONN_SEED);
    await runOnce('cms-site-ids', assignDefaultSite);
  });
}
