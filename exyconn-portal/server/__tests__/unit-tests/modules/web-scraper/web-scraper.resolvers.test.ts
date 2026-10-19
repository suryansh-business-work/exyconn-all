import { Types } from 'mongoose';
import { webScraperResolvers } from '../../../../src/modules/web-scraper/web-scraper.resolvers';
import { WebScrapeModel } from '../../../../src/modules/web-scraper/web-scrape.model';
import { FirecrawlConfigModel } from '../../../../src/modules/web-scraper/firecrawl-config.model';
import { registeredBulkTarget } from '../../../../src/modules/table-transfer/registry';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { openAiClient } from '../../../../src/utils/openai';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { seedPlatformOperator } from '../../security-authz.operator';
import {
  FIRECRAWL_KEY,
  HOSTED,
  firecrawlAnswers,
  resolvePublicly,
  seedFirecrawl,
  seedOpenAi,
} from './webScraperFixtures';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));

const ORGANIZATION = useTestOrganization();
const { Query, Mutation, FirecrawlConfig } = webScraperResolvers;
const complete = openAiClient.complete as jest.Mock;

const ctxAs = (roles: Role[], organizationId: string | null = ORGANIZATION): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    email: 'desk@exyconn.com',
    roles,
    organizationId,
  },
  organizationId,
});
const crm = () => ctxAs([ROLES.CRM]);
/** Tech staff of the platform operator, who manage the install's credentials. */
const platform = () => ctxAs([ROLES.TECH]);
const hr = () => ctxAs([ROLES.HR]);

beforeEach(async () => {
  resolvePublicly();
  // The suite's company is the install's operator, so its Tech staff manage Firecrawl.
  await seedPlatformOperator(ORGANIZATION);
});

afterEach(() => {
  jest.restoreAllMocks();
  complete.mockReset();
});

describe('FirecrawlConfig fields', () => {
  it('says whether a key is stored and shows only its hint', () => {
    expect(FirecrawlConfig.hasApiKey({ apiKey: FIRECRAWL_KEY })).toBe(true);
    expect(FirecrawlConfig.hasApiKey({})).toBe(false);
    const hint = FirecrawlConfig.apiKeyHint({ apiKey: FIRECRAWL_KEY });
    expect(hint).not.toBe(FIRECRAWL_KEY);
    expect(FIRECRAWL_KEY.endsWith(String(hint))).toBe(true);
    expect(FirecrawlConfig.apiKeyHint({})).toBeNull();
  });
});

describe('Firecrawl configs (Tech)', () => {
  it('creates, lists, updates, tests and deletes a config as platform staff', async () => {
    const ctx = platform();
    const created = await Mutation.createFirecrawlConfig(
      null,
      { input: { label: 'Main', baseUrl: HOSTED, apiKey: FIRECRAWL_KEY, isActive: true } },
      ctx,
    );
    expect(typeof created.id).toBe('string');

    const listed = await Query.firecrawlConfigs(null, {}, ctx);
    expect(listed.map((row) => row.id)).toEqual([created.id]);

    const updated = await Mutation.updateFirecrawlConfig(
      null,
      { id: created.id, input: { label: 'Renamed', baseUrl: HOSTED, apiKey: '' } },
      ctx,
    );
    expect(updated).toMatchObject({ id: created.id, label: 'Renamed' });

    firecrawlAnswers('abc');
    expect(await Mutation.testFirecrawlConfig(null, { id: created.id }, ctx)).toBe(
      'Firecrawl answered with 3 characters of markdown.',
    );

    expect(await Mutation.deleteFirecrawlConfig(null, { id: created.id }, ctx)).toBe(true);
    expect(await FirecrawlConfigModel.countDocuments()).toBe(0);
  });

  it('keeps the install’s key away from a company’s CRM desk', async () => {
    const config = await seedFirecrawl();
    const ctx = crm();

    expect(await codeOf(Query.firecrawlConfigs(null, {}, ctx))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.deleteFirecrawlConfig(null, { id: config.id }, ctx))).toBe(
      'FORBIDDEN',
    );
    expect(await FirecrawlConfigModel.countDocuments()).toBe(1);
  });
});

describe('Website scraper (CRM)', () => {
  it('says whether the scraper is ready', async () => {
    expect(await Query.firecrawlReady(null, {}, crm())).toBe(false);
    await seedFirecrawl();
    expect(await Query.firecrawlReady(null, {}, crm())).toBe(true);
  });

  it('scrapes a page, audits it, lists it, reads it, and deletes it', async () => {
    await seedFirecrawl();
    firecrawlAnswers('# Acme', 'Acme Ltd');
    const ctx = crm();

    const scrape = await Mutation.scrapeWebsite(null, { url: 'acme.example.com' }, ctx);
    expect(scrape).toMatchObject({
      url: 'https://acme.example.com/',
      createdByName: 'desk@exyconn.com',
    });

    const page = await Query.listWebScrapesPaged(null, { input: { page: 0, pageSize: 10 } }, ctx);
    expect(page.totalCount).toBe(1);
    expect(page.rows.map((row) => row.id)).toEqual([scrape.id]);

    expect(await Query.getWebScrape(null, { id: scrape.id }, ctx)).toMatchObject({
      id: scrape.id,
      title: 'Acme Ltd',
    });

    expect(await Mutation.deleteWebScrape(null, { id: scrape.id }, ctx)).toBe(true);
    const audit = await AuditLogModel.find({ module: 'WebScrape' }).sort({ createdAt: 1 }).lean();
    expect(audit.map((row) => [row.action, row.entityId])).toEqual([
      ['CREATE', scrape.id],
      ['DELETE', scrape.id],
    ]);
  });

  it('estimates and runs the AI over a kept page', async () => {
    await seedOpenAi();
    complete.mockResolvedValue({
      text: 'Anvils',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });
    const scrape = await WebScrapeModel.create({
      url: 'https://acme.example.com/',
      markdown: 'We sell anvils.',
      charCount: 15,
      createdById: 'u1',
    });
    const ctx = crm();

    const estimate = await Query.webScrapeAiEstimate(
      null,
      { id: scrape.id, instruction: 'What do they sell?' },
      ctx,
    );
    expect(estimate).toMatchObject({ priced: false, truncated: false });

    const analyzed = await Mutation.analyzeWebScrape(
      null,
      { id: scrape.id, instruction: 'What do they sell?' },
      ctx,
    );
    expect(analyzed).toMatchObject({ id: scrape.id, aiResponse: 'Anvils' });
  });

  it('refuses somebody without the CRM role', async () => {
    const scrape = await WebScrapeModel.create({
      url: 'https://a.example.com/',
      createdById: 'u1',
    });

    expect(await codeOf(Query.getWebScrape(null, { id: scrape.id }, hr()))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.scrapeWebsite(null, { url: 'a.example.com' }, hr()))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('bulk archive', () => {
  it('archives and restores the chosen pages for the CRM desk', async () => {
    const target = registeredBulkTarget('listWebScrapesPaged');
    const scrape = await WebScrapeModel.create({
      url: 'https://a.example.com/',
      createdById: 'u1',
    });
    const ids = [scrape.id];

    expect(target?.entity).toBe('WebScrape');
    expect(await target?.archive?.(crm(), ids, true)).toBe(1);
    expect(
      (await WebScrapeModel.collection.findOne({ _id: scrape._id }))?.archivedAt,
    ).toBeInstanceOf(Date);
    expect(await target?.archive?.(crm(), ids, false)).toBe(1);
  });

  it('refuses to archive for somebody without the CRM role', async () => {
    const target = registeredBulkTarget('listWebScrapesPaged');

    expect(await codeOf(Promise.resolve(target?.archive?.(hr(), [], true)))).toBe('FORBIDDEN');
  });
});
