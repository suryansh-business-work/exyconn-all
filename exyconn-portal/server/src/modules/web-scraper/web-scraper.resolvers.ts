import { ROLES } from '../../constants/roles';
import { auditArchive } from '../../lib/archiveAudit';
import { archiveRecords } from '../../lib/archivable';
import { assertPermission, PERMISSION_MODULES } from '../../lib/permissions';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import type { GraphQLContext } from '../../middleware/auth';
import { withId, withIds } from '../../utils/serialize';
import { tableQuery, type TableConfig, type TableQueryInput } from '../../utils/tableQuery';
import { recordAudit } from '../audit';
import type { PermissionAction } from '../permissions/permission.model';
import { secretHint } from '../tech/tech.secrets';
import { registerBulkTarget, registerTable } from '../table-transfer/registry';
import { WebScrapeModel } from './web-scrape.model';
import { firecrawlConfigs, webScraper, type FirecrawlConfigInput } from './web-scraper.service';

const MODULE = 'WebScrape';
PERMISSION_MODULES.add(MODULE);

/** Each scrape is billed to the install's Firecrawl account. */
const scrapeLimiter = createLimiter({ keyPrefix: 'web_scrape', points: 200, durationSec: 3600 });

const TABLE: TableConfig = {
  searchFields: ['url', 'title', 'createdByName'],
  filterFields: ['url', 'title', 'createdByName'],
  sortFields: ['createdAt', 'url', 'title', 'charCount'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
const LIST = 'listWebScrapesPaged';

/** The key sits with the install's other credentials: the platform's own Tech staff only. */
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

/** The scraper is a sales tool: the CRM desk, under the module's own permissions. */
async function crmDesk(ctx: GraphQLContext, action: PermissionAction) {
  const user = await assertPermission(ctx, MODULE, [ROLES.CRM], action);
  return { id: user.id, name: user.email };
}

registerTable(LIST, TABLE);
registerBulkTarget(LIST, {
  entity: MODULE,
  archive: async (ctx, ids, archived) => {
    await crmDesk(ctx, 'EDIT');
    const changed = await archiveRecords(WebScrapeModel as never, ids, archived);
    await auditArchive(ctx, MODULE, ids, archived);
    return changed;
  },
});

type ConfigRow = { apiKey?: string };

export const webScraperResolvers = {
  FirecrawlConfig: {
    hasApiKey: (row: ConfigRow) => Boolean(row.apiKey),
    apiKeyHint: (row: ConfigRow) => secretHint(row.apiKey),
  },
  Query: {
    firecrawlConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return withIds(await firecrawlConfigs.list());
    },
    firecrawlReady: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await crmDesk(ctx, 'VIEW');
      return firecrawlConfigs.ready();
    },
    listWebScrapesPaged: async (
      _p: unknown,
      { input }: { input: TableQueryInput },
      ctx: GraphQLContext,
    ) => {
      await crmDesk(ctx, 'VIEW');
      const page = await tableQuery(WebScrapeModel, input, TABLE);
      return { rows: withIds(page.rows as { _id: unknown }[]), totalCount: page.totalCount };
    },
    getWebScrape: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await crmDesk(ctx, 'VIEW');
      return withId(await webScraper.get(id));
    },
    webScrapeAiEstimate: async (
      _p: unknown,
      { id, instruction }: { id: string; instruction: string },
      ctx: GraphQLContext,
    ) => {
      await crmDesk(ctx, 'VIEW');
      return webScraper.estimate(id, instruction);
    },
  },
  Mutation: {
    createFirecrawlConfig: async (
      _p: unknown,
      { input }: { input: FirecrawlConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'CREATE');
      return withId(await firecrawlConfigs.create(input));
    },
    updateFirecrawlConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: FirecrawlConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return withId(await firecrawlConfigs.update(id, input));
    },
    testFirecrawlConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return firecrawlConfigs.test(id);
    },
    deleteFirecrawlConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'DELETE');
      return firecrawlConfigs.remove(id);
    },
    scrapeWebsite: async (_p: unknown, { url }: { url: string }, ctx: GraphQLContext) => {
      const actor = await crmDesk(ctx, 'CREATE');
      await enforceLimit(scrapeLimiter, actor.id, 'website scrapes');
      const scrape = withId(await webScraper.scrape(url, actor));
      await recordAudit(ctx, {
        action: 'CREATE',
        module: MODULE,
        entityId: scrape.id,
        entityLabel: scrape.url,
        summary: 'Scraped a website',
      });
      return scrape;
    },
    deleteWebScrape: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await crmDesk(ctx, 'DELETE');
      const removed = await webScraper.remove(id);
      await recordAudit(ctx, {
        action: 'DELETE',
        module: MODULE,
        entityId: id,
        summary: 'Deleted a scraped page',
      });
      return removed;
    },
    analyzeWebScrape: async (
      _p: unknown,
      { id, instruction }: { id: string; instruction: string },
      ctx: GraphQLContext,
    ) => {
      const actor = await crmDesk(ctx, 'EDIT');
      return withId(await webScraper.analyze(id, instruction, actor));
    },
  },
};
