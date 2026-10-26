import { currentOrganizationId, runForOrganization } from '../../../lib/tenant';
import { badRequest, notFound } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { withId } from '../../../utils/serialize';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../../utils/tableQuery';
import { registerTable } from '../../table-transfer/registry';
import { ClutchRunModel } from './clutch.models';
import { runOnApify, runOnClutchMcp, type ClutchQuery, type EngineResult } from './clutch.engines';
import { leadSourceSettings } from './clutch.settings';

export type ClutchEngine = 'MCP' | 'APIFY';

export interface ClutchSearchInput extends ClutchQuery {
  engine: ClutchEngine;
}

/** A search is a paid call on Apify: one asks for at most this many companies. */
export const MAX_CLUTCH_ITEMS = 200;
const MAX_PROFILE_URLS = 20;

const RUN_TABLE: TableConfig = {
  searchFields: ['keyword', 'location', 'industry', 'startedByName'],
  filterFields: ['engine', 'status', 'startedByName'],
  sortFields: ['createdAt', 'companyCount', 'keyword'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
registerTable('clutchRunsPaged', RUN_TABLE);

const CLUTCH_PROFILE = /^https:\/\/clutch\.co\/profile\/[\w-]+/;

function checked(input: ClutchSearchInput): ClutchSearchInput {
  const keyword = input.keyword.trim().slice(0, 200);
  const profileUrls = input.profileUrls.map((url) => url.trim()).filter(Boolean);
  if (!keyword && profileUrls.length === 0) {
    badRequest('Type what to search for, or paste a Clutch profile link.');
  }
  if (
    profileUrls.length > MAX_PROFILE_URLS ||
    profileUrls.some((url) => !CLUTCH_PROFILE.test(url))
  ) {
    badRequest('Paste up to 20 Clutch profile links, like https://clutch.co/profile/acme.');
  }
  const maxItems = Math.min(Math.max(Math.round(input.maxItems) || 1, 1), MAX_CLUTCH_ITEMS);
  return {
    ...input,
    keyword,
    location: input.location.trim().slice(0, 120),
    industry: input.industry.trim().slice(0, 120),
    profileUrls,
    maxItems,
  };
}

async function runEngine(query: ClutchSearchInput): Promise<EngineResult> {
  if (query.engine === 'MCP') {
    return runOnClutchMcp(query);
  }
  const apify = await leadSourceSettings.apify();
  if (!apify) {
    badRequest('Add an Apify API token first, or search with Clutch’s own server.');
  }
  return runOnApify(query, apify.token, apify.actorId);
}

/** Runs a stored search to the end, recording what it found or why it failed. */
async function execute(id: string, query: ClutchSearchInput): Promise<void> {
  try {
    const { companies, notes } = await runEngine(query);
    await ClutchRunModel.updateOne(
      { _id: id },
      {
        status: 'SUCCEEDED',
        companies,
        companyCount: companies.length,
        notes,
        finishedAt: new Date(),
      },
    );
  } catch (error) {
    logger.warn({ err: error, runId: id, engine: query.engine }, 'Clutch search failed');
    await ClutchRunModel.updateOne(
      { _id: id },
      {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'The search failed.',
        finishedAt: new Date(),
      },
    );
  }
}

export const clutchRuns = {
  /**
   * Starts a search and answers at once: an Apify scrape can take minutes, so the run finishes in
   * the background, in the caller's company, and the page polls it.
   */
  async start(input: ClutchSearchInput, actor: { id: string; name: string }) {
    const query = checked(input);
    if (query.engine === 'APIFY' && !(await leadSourceSettings.apify())) {
      badRequest('Add an Apify API token first, or search with Clutch’s own server.');
    }
    const run = await ClutchRunModel.create({
      ...query,
      startedById: actor.id,
      startedByName: actor.name,
    });
    const id = String(run._id);
    const organizationId = currentOrganizationId();
    const work = () => execute(id, query);
    const background = organizationId ? runForOrganization(organizationId, work) : work();
    background.catch((error: unknown) =>
      logger.error({ err: error, runId: id }, 'Clutch run lost'),
    );
    return withId(run.toObject());
  },

  async get(id: string) {
    const run = await ClutchRunModel.findById(id).lean();
    return run ? withId(run) : notFound('Clutch search');
  },

  page: (input: TableQueryInput) => tableQuery(ClutchRunModel, input, RUN_TABLE),

  async remove(id: string) {
    const run = await ClutchRunModel.findByIdAndDelete(id).lean();
    return Boolean(run) || notFound('Clutch search');
  },
};
