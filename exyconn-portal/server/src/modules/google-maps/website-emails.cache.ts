import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  findWebsiteEmails,
  siteUrl,
  type WebsiteEmailResult,
  type WebsiteEmailStatus,
} from './website-emails';

/**
 * Remembers what each website published, so a site is crawled at most once a week however many
 * people (or MCP clients) ask for it. That keeps the lead generator polite: a business's site
 * never sees the same crawl twice in a row, and the server's address is not one a site learns
 * to block. Published addresses are public, so one company's lookup serves every company's.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_MS = 7 * DAY_MS;
/** A site that did not answer is retried after an hour, not hit again straight away. */
const KEEP_UNREACHABLE_MS = 60 * 60 * 1000;

const leadEmailLookupSchema = new Schema({
  site: { type: String, required: true, unique: true },
  emails: { type: [String], default: [] },
  status: { type: String, required: true },
  message: { type: String, default: '' },
  expiresAt: { type: Date, required: true, expires: 0 },
});

type LeadEmailLookupDocument = InferSchemaType<typeof leadEmailLookupSchema>;
export const LeadEmailLookupModel: Model<LeadEmailLookupDocument> = model<LeadEmailLookupDocument>(
  'LeadEmailLookup',
  leadEmailLookupSchema,
);

/** One key per page: host without `www.`, and the path without a trailing slash. */
function siteKey(website: string): string {
  const url = siteUrl(website);
  const host = url.hostname.toLowerCase();
  const bare = host.startsWith('www.') ? host.slice(4) : host;
  const path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
  return bare + path;
}

/** Lookups in progress, so parallel requests for one site share a single crawl. */
const inFlight = new Map<string, Promise<WebsiteEmailResult>>();

async function crawlAndRemember(site: string, website: string): Promise<WebsiteEmailResult> {
  const found = await findWebsiteEmails(website);
  const keepMs = found.status === 'UNREACHABLE' ? KEEP_UNREACHABLE_MS : KEEP_MS;
  await LeadEmailLookupModel.updateOne(
    { site },
    { $set: { ...found, expiresAt: new Date(Date.now() + keepMs) } },
    { upsert: true },
  );
  return found;
}

/**
 * The website's published addresses: from the last week's lookup when there is one, else from a
 * fresh crawl. `beforeCrawl` runs only when the site is actually read (the caller's rate limit).
 */
export async function websiteEmailsOnce(
  website: string,
  beforeCrawl: () => Promise<void>,
): Promise<WebsiteEmailResult> {
  const site = siteKey(website);
  const saved = await LeadEmailLookupModel.findOne({ site, expiresAt: { $gt: new Date() } }).lean();
  if (saved) {
    const status = saved.status as WebsiteEmailStatus;
    return { emails: saved.emails, status, message: saved.message };
  }
  const pending = inFlight.get(site);
  if (pending) {
    return pending;
  }
  // Registered before anything awaits, so a parallel request for this site joins this crawl.
  const crawl = beforeCrawl()
    .then(() => crawlAndRemember(site, website))
    .finally(() => inFlight.delete(site));
  inFlight.set(site, crawl);
  return crawl;
}
