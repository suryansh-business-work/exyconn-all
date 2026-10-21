import { runAsPlatform, currentOrganizationId } from '../../../lib/tenant';
import { notFound } from '../../../utils/errors';
import { escapeRegex } from '../../../utils/tableQuery';
import type { AiActor } from '../../ai/ai.service';
import { OrganizationModel } from '../../organizations/organization.model';
import { WebScrapeModel } from '../../web-scraper/web-scrape.model';
import { webScraper } from '../../web-scraper/web-scraper.service';
import { crmTimeline } from '../timeline/crm.timeline';
import { companyFacts, contactFacts } from './cold-email.facts';
import type { ColdEmailObject } from './cold-email.model';

/** How much of their website the model reads, so one long page cannot spend the budget. */
export const MAX_WEBSITE_CHARS = 6000;
/** The latest touchpoints the model reads, so it does not pitch someone already talking to us. */
const HISTORY_ITEMS = 10;

/** The record's name, website and profile lines; not found when it is gone. */
export async function recordFacts(object: ColdEmailObject, id: string) {
  const facts = object === 'CONTACT' ? await contactFacts(id) : await companyFacts(id, true);
  if (!facts) {
    notFound(object === 'CONTACT' ? 'Contact' : 'Company');
  }
  return facts;
}

/** A website's host without "www.", or null when it is not an address. */
export function hostOf(website: string): string | null {
  const raw = website.trim();
  if (raw === '') {
    return null;
  }
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return URL.canParse(withScheme) ? new URL(withScheme).hostname.replace(/^www\./i, '') : null;
}

/**
 * Their website as text: read now through Firecrawl when the person asked for it (that costs a
 * Firecrawl call), otherwise the latest page of theirs already scraped, if any.
 */
async function websiteText(website: string, readNow: boolean, actor: AiActor): Promise<string> {
  const host = hostOf(website);
  if (!host) {
    return '';
  }
  if (readNow) {
    return (await webScraper.scrape(website, actor)).markdown;
  }
  const stored = await WebScrapeModel.findOne({
    url: { $regex: String.raw`^https?://(www\.)?${escapeRegex(host)}(/|$)`, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .select('markdown')
    .lean();
  return stored?.markdown ?? '';
}

async function historyLines(object: ColdEmailObject, id: string): Promise<string[]> {
  const items = await crmTimeline(object, id, HISTORY_ITEMS);
  return items.map((item) => `${item.at.toISOString().slice(0, 10)} ${item.kind}: ${item.title}`);
}

/** The name of the company sending the email. */
export async function organizationName(): Promise<string> {
  const id = currentOrganizationId();
  const organization = id
    ? await runAsPlatform(() => OrganizationModel.findById(id).select('name').lean())
    : null;
  return organization?.name ?? 'our company';
}

/** Everything the model reads about the record before writing to them. */
export async function businessContext(
  object: ColdEmailObject,
  id: string,
  readWebsite: boolean,
  actor: AiActor,
) {
  const facts = await recordFacts(object, id);
  const [website, history] = await Promise.all([
    websiteText(facts.website, readWebsite, actor),
    historyLines(object, id),
  ]);
  const sections = [facts.lines.join('\n')];
  if (history.length > 0) {
    sections.push(`What has happened with them so far, newest first:\n${history.join('\n')}`);
  }
  if (website) {
    sections.push(`Their website:\n${website.slice(0, MAX_WEBSITE_CHARS)}`);
  }
  return { name: facts.name, context: sections.join('\n\n') };
}
