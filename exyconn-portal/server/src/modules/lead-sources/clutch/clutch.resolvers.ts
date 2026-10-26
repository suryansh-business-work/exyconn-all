import { ROLES } from '../../../constants/roles';
import { actorNameOf } from '../../../lib/actor';
import { assertPermission } from '../../../lib/permissions';
import { createLimiter, enforceLimit } from '../../../lib/rateLimiter';
import { assertRole } from '../../../middleware/roleGuard';
import type { GraphQLContext } from '../../../middleware/auth';
import type { TableQueryInput } from '../../../utils/tableQuery';
import { recordAudit } from '../../audit';
import { userOrigin } from '../../crm/crm.origin';
import { importClutchCompanies } from './clutch.import';
import { clutchRuns, type ClutchSearchInput } from './clutch.runs';
import { leadSourceSettings, type LeadSourceSettingsInput } from './clutch.settings';

/** Apify runs cost money and Clutch's server is shared: a person starts a few a minute at most. */
const searchLimiter = createLimiter({ keyPrefix: 'clutch_search', points: 10, durationSec: 60 });

/** Searching is the sales desk's, like the Google Business generator. */
const crmDesk = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.CRM]);

const audit = (ctx: GraphQLContext, summary: string, entityId?: unknown) =>
  recordAudit(ctx, {
    action: 'UPDATE',
    module: 'Company',
    entityId,
    entityLabel: 'Clutch',
    summary,
  });

export const clutchResolvers = {
  Query: {
    clutchRun: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return clutchRuns.get(id);
    },
    clutchRunsPaged: (_p: unknown, { input }: { input: TableQueryInput }, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return clutchRuns.page(input);
    },
    leadSourceConfig: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return leadSourceSettings.view();
    },
  },
  Mutation: {
    startClutchSearch: async (
      _p: unknown,
      { input }: { input: ClutchSearchInput },
      ctx: GraphQLContext,
    ) => {
      const user = crmDesk(ctx);
      await enforceLimit(searchLimiter, user.id, 'Clutch searches');
      return clutchRuns.start(input, { id: user.id, name: await actorNameOf(ctx) });
    },
    deleteClutchRun: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return clutchRuns.remove(id);
    },
    importClutchCompanies: async (
      _p: unknown,
      { runId, keys }: { runId: string; keys: string[] },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Company', [ROLES.CRM], 'CREATE');
      const result = await importClutchCompanies(runId, keys, await userOrigin(ctx, 'CLUTCH'));
      await audit(
        ctx,
        `Added ${result.created} Clutch compan${result.created === 1 ? 'y' : 'ies'} and ${result.contactsCreated} contact(s); skipped ${result.skipped}`,
        runId,
      );
      return result;
    },
    saveLeadSourceConfig: async (
      _p: unknown,
      { input }: { input: LeadSourceSettingsInput },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Company', [ROLES.CRM], 'EDIT');
      const view = await leadSourceSettings.save(input, await actorNameOf(ctx));
      await audit(
        ctx,
        `Saved the Apify settings for lead generators (actor ${view.clutchActorId})`,
      );
      return view;
    },
    clearApifyToken: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, 'Company', [ROLES.CRM], 'EDIT');
      const view = await leadSourceSettings.clearToken(await actorNameOf(ctx));
      await audit(ctx, 'Removed the Apify token for lead generators');
      return view;
    },
  },
};
