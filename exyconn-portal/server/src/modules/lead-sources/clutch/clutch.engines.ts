import { callClutchTool } from './clutch.mcp.client';
import { actorInput, runApifyActor } from './clutch.apify.client';
import { fromApifyItem, fromMcpProvider, fromMcpReview } from './clutch.normalize';
import { list, type ClutchCompany } from './clutch.types';

/** What a search asks for, as the run stores it. */
export interface ClutchQuery {
  keyword: string;
  location: string;
  industry: string;
  profileUrls: string[];
  includeDetails: boolean;
  includeReviews: boolean;
  includePortfolio: boolean;
  maxItems: number;
}

export interface EngineResult {
  companies: ClutchCompany[];
  notes: string[];
}

/** How many reviews Clutch's own server is asked for per company. */
const MCP_REVIEWS = 10;

/** "https://clutch.co/profile/rtcamp" → "rtcamp": what Clutch's server looks a company up by. */
export const profileSlug = (url: string): string =>
  (url.split('/profile/')[1] ?? '').split(/[/?#]/)[0] ?? '';

/**
 * Clutch's own MCP server (free): a ranked search by service, place and industry, profiles by
 * name, and reviews per company. It returns a handful of top matches, not every page, and no
 * portfolio — the notes say so, so the person knows to use Apify for those.
 */
export async function runOnClutchMcp(query: ClutchQuery): Promise<EngineResult> {
  const notes: string[] = [];
  const companies: ClutchCompany[] = [];
  if (query.keyword) {
    const found = await callClutchTool('recommend_service_providers', {
      service: query.keyword,
      location: query.location || null,
      industry: query.industry || null,
    });
    companies.push(...list(found.providers).map(fromMcpProvider));
    notes.push(
      'Clutch’s own server returns its top matches, not every result page. Use Apify to page through all of them.',
    );
  }
  for (const url of query.profileUrls) {
    const info = await callClutchTool('get_provider_info', {
      company_name: profileSlug(url) || url,
    });
    companies.push(fromMcpProvider(info));
  }
  const kept = companies.slice(0, query.maxItems);
  if (query.includeReviews) {
    for (const company of kept) {
      const answer = await callClutchTool('get_service_provider_reviews', {
        company_name: company.name,
        limit: MCP_REVIEWS,
      });
      company.reviews = list(answer.reviews_sample).map(fromMcpReview);
    }
  }
  if (query.includePortfolio) {
    notes.push('Portfolio items come with Apify; Clutch’s own server does not list them.');
  }
  return { companies: kept, notes };
}

/** An Apify Clutch scraper: every result page, full profiles, reviews and portfolio on request. */
export async function runOnApify(
  query: ClutchQuery,
  token: string,
  actorId: string,
): Promise<EngineResult> {
  const items = await runApifyActor(token, actorId, actorInput({ ...query }));
  const companies = items
    .map(fromApifyItem)
    .filter((company) => company.name)
    .slice(0, query.maxItems);
  return { companies, notes: [] };
}
