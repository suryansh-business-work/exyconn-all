import { env } from '../../config/env';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { safeFetch } from '../../utils/safeFetch';
import { BlogPostModel } from '../website/models/blog.model';
import { CaseStudyModel } from '../website/models/case-study.model';
import { ChatKnowledgeModel, ChatSettingsModel } from './models';
import { chunk, htmlToText, titleOf } from './chat.text';

/** Pages one sync reads at most, and how many it fetches side by side. */
const MAX_PAGES = 200;
const CONCURRENCY = 4;
const CHUNK_CHARS = 1500;
const MAX_CHUNKS_PER_PAGE = 4;
const PAGE_TIMEOUT_MS = 15_000;
const PAGE_MAX_BYTES = 3 * 1024 * 1024;

interface KnowledgeRow {
  title: string;
  url: string;
  content: string;
}

const marketPrefix = `/${env.chatKnowledgeMarket}`;

/** The sitemap's pages in the one market the bot reads. */
async function sitemapPages(): Promise<string[]> {
  const response = await safeFetch(
    `${env.websiteUrl}/sitemap.xml`,
    {},
    { maxBytes: 8 * 1024 * 1024 },
  );
  if (!response.ok) {
    throw new Error(`The sitemap answered ${response.status}`);
  }
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
  const inMarket = urls.filter((url) => {
    const path = new URL(url).pathname;
    return path === marketPrefix || path.startsWith(`${marketPrefix}/`);
  });
  return [...new Set(inMarket)].slice(0, MAX_PAGES);
}

/** One page's text, split into rows. A page that fails is skipped and logged. */
async function pageRows(url: string): Promise<KnowledgeRow[]> {
  try {
    const response = await safeFetch(
      url,
      {},
      { timeoutMs: PAGE_TIMEOUT_MS, maxBytes: PAGE_MAX_BYTES },
    );
    if (!response.ok) {
      logger.warn(`Website chat sync skipped ${url} (${response.status})`);
      return [];
    }
    const html = await response.text();
    return rowsOf(titleOf(html) || url, url, htmlToText(html));
  } catch (error) {
    logger.warn({ err: error }, `Website chat sync skipped ${url}`);
    return [];
  }
}

function rowsOf(title: string, url: string, text: string): KnowledgeRow[] {
  const pieces = chunk(text, CHUNK_CHARS, MAX_CHUNKS_PER_PAGE);
  return pieces.map((content, index) => ({
    title: pieces.length > 1 ? `${title} (part ${index + 1})` : title,
    url,
    content,
  }));
}

/** Reads `urls` a few at a time. */
async function crawl(urls: string[]): Promise<KnowledgeRow[]> {
  const rows: KnowledgeRow[] = [];
  const queue = [...urls];
  const worker = async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
      rows.push(...(await pageRows(url)));
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return rows;
}

/** Published blog posts and case studies, read straight from the website's own records. */
async function articleRows(): Promise<KnowledgeRow[]> {
  const [posts, studies] = await runAsPlatform(() =>
    Promise.all([
      BlogPostModel.find({ isActive: true }).select('slug title summary content').lean(),
      CaseStudyModel.find({ isActive: true }).select('slug title excerpt content').lean(),
    ]),
  );
  const base = `${env.websiteUrl}${marketPrefix}`;
  return [
    ...posts.flatMap((post) =>
      rowsOf(
        post.title,
        `${base}/blog/${post.slug}`,
        htmlToText(`${post.summary} ${post.content}`),
      ),
    ),
    ...studies.flatMap((study) =>
      rowsOf(
        study.title,
        `${base}/case-studies/${study.slug}`,
        htmlToText(`${study.excerpt} ${study.content}`),
      ),
    ),
  ];
}

/**
 * Re-reads exyconn.com into the bot's knowledge: every page of the sitemap in one market, and
 * every published blog post and case study. Replaces the previous sync's rows; what the team
 * wrote by hand (CUSTOM) is never touched.
 */
export async function syncWebsiteKnowledge(): Promise<{ count: number; syncedAt: Date }> {
  let rows: KnowledgeRow[];
  try {
    const [pages, articles] = await Promise.all([sitemapPages().then(crawl), articleRows()]);
    rows = [...pages, ...articles].filter((row) => row.content.length > 0);
  } catch (error) {
    logger.error({ err: error }, 'Website chat knowledge sync failed');
    const message = error instanceof Error ? error.message : 'unknown error';
    await ChatSettingsModel.updateOne({}, { knowledgeSyncError: message });
    badRequest('Could not read the website just now. Try again in a few minutes.');
  }
  const syncedAt = new Date();
  await ChatKnowledgeModel.deleteMany({ source: 'WEBSITE' });
  await ChatKnowledgeModel.insertMany(rows.map((row) => ({ ...row, source: 'WEBSITE' })));
  await ChatSettingsModel.updateOne(
    {},
    { knowledgeSyncedAt: syncedAt, knowledgeSyncCount: rows.length, knowledgeSyncError: '' },
  );
  logger.info(`Website chat knowledge synced: ${rows.length} rows`);
  return { count: rows.length, syncedAt };
}
