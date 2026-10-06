import { fragmentIdsOf, type CmsBlock } from '@exyconn/cms';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import { badRequest, notFound } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { assertCaptcha } from '../website/website.captcha';
import {
  CmsDesignSystemModel,
  CmsFragmentModel,
  CmsPageModel,
  CmsSiteModel,
  NewsletterIssueModel,
} from './models';
import { compileDraft } from './cms.documents';
import { newsletter } from './cms.newsletter';
import { previewPageId } from './cms.preview';
import { siteForHost } from './cms.sites';

/** How deep fragments may nest inside fragments before the chain is cut. */
const MAX_FRAGMENT_DEPTH = 4;

interface PublishedFragment {
  id: string;
  blocks: CmsBlock[];
  css: string;
}

/** The published fragments a block tree uses, and the ones they use in turn. */
async function fragmentsFor(siteId: string, blocks: CmsBlock[]): Promise<PublishedFragment[]> {
  const found = new Map<string, PublishedFragment>();
  let wanted = fragmentIdsOf(blocks);
  for (let depth = 0; depth < MAX_FRAGMENT_DEPTH && wanted.length > 0; depth += 1) {
    const ids = wanted.filter((id) => !found.has(id) && /^[a-f\d]{24}$/i.test(id));
    const rows = await CmsFragmentModel.find({
      _id: { $in: ids },
      siteId,
      published: { $ne: null },
    })
      .select('published')
      .lean();
    wanted = [];
    for (const row of rows) {
      const fragment = {
        id: String(row._id),
        blocks: (row.published?.blocks ?? []) as CmsBlock[],
        css: row.published?.css ?? '',
      };
      found.set(fragment.id, fragment);
      wanted.push(...fragmentIdsOf(fragment.blocks));
    }
  }
  return [...found.values()];
}

/**
 * Everything every page of the site served at `host` shares: the site, its design system and
 * its header and footer (published), with the fragments they place.
 */
export async function publicSite(host: string) {
  const site = await siteForHost(host);
  const siteId = String(site._id);
  const [design, chrome] = await Promise.all([
    site.designSystemId ? CmsDesignSystemModel.findById(site.designSystemId).lean() : null,
    CmsFragmentModel.find({
      _id: { $in: [site.headerFragmentId, site.footerFragmentId].filter(Boolean) },
      siteId,
      published: { $ne: null },
    })
      .select('published')
      .lean(),
  ]);
  const chromeBlocks = chrome.flatMap((row) => (row.published?.blocks ?? []) as CmsBlock[]);
  const fragments = [
    ...chrome.map((row) => ({
      id: String(row._id),
      blocks: (row.published?.blocks ?? []) as CmsBlock[],
      css: row.published?.css ?? '',
    })),
    ...(await fragmentsFor(siteId, chromeBlocks)),
  ];
  return {
    site: withId(site),
    designSystem: design ? withId(design) : null,
    fragments,
  };
}

/** The params a template path binds, or null when `path` does not fit `pattern`. */
function matchTemplate(pattern: string, path: string): Record<string, string> | null {
  const wanted = pattern.split('/');
  const given = path.split('/');
  if (wanted.length !== given.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < wanted.length; i += 1) {
    if (wanted[i].startsWith(':')) {
      if (given[i] === '') return null;
      params[wanted[i].slice(1)] = decodeURIComponent(given[i]);
    } else if (wanted[i] !== given[i]) {
      return null;
    }
  }
  return params;
}

type PageRow = Awaited<ReturnType<typeof CmsPageModel.findOne>> & Record<string, unknown>;

/** A published page at `path`, else the published template the path fits, with its params. */
async function livePage(siteId: string, path: string) {
  const exact = await CmsPageModel.findOne({ siteId, path, kind: 'PAGE', published: { $ne: null } })
    .select('-draft')
    .lean();
  if (exact) {
    return { row: exact, params: {} as Record<string, string> };
  }
  const templates = await CmsPageModel.find({ siteId, kind: 'TEMPLATE', published: { $ne: null } })
    .select('-draft')
    .lean();
  for (const template of templates) {
    const params = matchTemplate(template.path, path);
    if (params) {
      return { row: template, params };
    }
  }
  return null;
}

/** A page's draft, compiled on the fly, for a valid preview link. */
async function previewPage(siteId: string, token: string) {
  const pageId = previewPageId(token);
  if (!pageId) {
    badRequest('This preview link has expired. Open a new one from the page editor.');
  }
  const row = await CmsPageModel.findOne({ _id: pageId, siteId }).lean();
  if (!row) notFound('Page');
  const compiled = await compileDraft(row.draft, siteId);
  return {
    row: { ...row, published: { ...compiled, publishedAt: new Date() } } as PageRow,
    params: {} as Record<string, string>,
  };
}

/**
 * The page to render for (site, path): published, or a draft for a valid preview token. Null
 * when nothing lives there (the website shows its 404).
 */
export async function publicPage(siteId: string, path: string, previewToken?: string | null) {
  const found = previewToken
    ? await previewPage(siteId, previewToken)
    : await livePage(siteId, path);
  if (!found) {
    return null;
  }
  const { row, params } = found;
  const published = row.published as { blocks: CmsBlock[]; css: string; publishedAt: Date };
  return {
    page: {
      id: String(row._id),
      path: row.path,
      kind: row.kind,
      title: row.title,
      seo: row.seo,
      layout: row.layout,
      blocks: published.blocks,
      css: published.css,
      publishedAt: published.publishedAt,
      params,
      preview: Boolean(previewToken),
    },
    fragments: await fragmentsFor(siteId, published.blocks),
  };
}

/** Every published page's path, for the sitemap and llms.txt. Templates are expanded elsewhere. */
export async function publicPaths(siteId: string) {
  const rows = await CmsPageModel.find({
    siteId,
    kind: 'PAGE',
    published: { $ne: null },
    'seo.noindex': { $ne: true },
  })
    .select('path updatedAt')
    .sort({ path: 1 })
    .lean();
  return rows.map((row) => ({ path: row.path, updatedAt: row.updatedAt }));
}

export async function publicIssues(siteId: string) {
  const rows = await NewsletterIssueModel.find({ siteId, isActive: true })
    .select('-content -contentCss')
    .sort({ publishedAt: -1 })
    .limit(200)
    .lean();
  return withIds(rows as Array<{ _id: unknown }>);
}

export async function publicIssue(siteId: string, slug: string) {
  const row = await NewsletterIssueModel.findOne({ siteId, slug, isActive: true }).lean();
  return row ? withId(row) : null;
}

/** Sign-ups arrive from the website's server, answering its security question. */
const subscribeLimiter = createLimiter({
  keyPrefix: 'newsletter_subscribe_website',
  points: 120,
  durationSec: 10 * 60,
});

export interface NewsletterSignup {
  site?: string | null;
  email: string;
  name?: string | null;
  source?: string | null;
}

export async function publicSubscribe(
  siteId: string,
  input: NewsletterSignup,
  captcha: { token: string; answer: string },
) {
  if (!siteId || !(await CmsSiteModel.exists({ _id: siteId }))) {
    notFound('Website');
  }
  await enforceLimit(subscribeLimiter, 'website', 'sign-ups');
  await assertCaptcha(captcha.token, captcha.answer);
  return newsletter.subscribe(siteId, input.email, input.name ?? '', input.source ?? '');
}
