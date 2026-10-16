import { ROLES } from '../../constants/roles';
import { actorNameOf } from '../../lib/actor';
import { assertPermission } from '../../lib/permissions';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { createLimiter, enforceLimit } from '../../lib/rateLimiter';
import type { GraphQLContext } from '../../middleware/auth';
import { assertRole } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { withId, withIds } from '../../utils/serialize';
import { UnsafeUrlError } from '../../utils/safeFetch';
import { recordAudit } from '../audit';
import { CompanyModel } from '../crm/company.model';
import type { PermissionAction } from '../permissions/permission.model';
import { secretHint } from '../tech/tech.secrets';
import { googleMapsConfigs, type GoogleMapsConfigInput } from './google-maps-config.service';
import { importLeads, LEAD_SOURCE, type LeadImportInput } from './lead-import.service';
import { activeServerKey, searchText, type LeadSearchInput } from './places.client';
import { findWebsiteEmails } from './website-emails';

const HOUR = 60 * 60;

/** Every search is billed to the install's Google account: a person gets a working day's worth. */
const searchLimiter = createLimiter({ keyPrefix: 'lead_search', points: 200, durationSec: HOUR });
/** Each lookup reads up to four pages of somebody else's website. */
const emailLimiter = createLimiter({ keyPrefix: 'lead_emails', points: 400, durationSec: HOUR });

/** The keys sit with the install's other credentials: the platform's own Tech staff only. */
const techStaff = (ctx: GraphQLContext, action: PermissionAction) =>
  assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], action);

/** The lead generator and the CRM maps are the sales desk's. */
const crmDesk = (ctx: GraphQLContext) => assertRole(ctx, [ROLES.CRM]);

type ConfigRow = { browserKey?: string; serverKey?: string };

/** Adds `existingCompanyId` to each place already filed as a company. */
async function withExisting<T extends { placeId: string }>(places: T[]) {
  const filed = await CompanyModel.find({ placeId: { $in: places.map((p) => p.placeId) } })
    .select('placeId')
    .lean();
  const byPlace = new Map(filed.map((company) => [company.placeId, String(company._id)]));
  return places.map((place) => ({
    ...place,
    existingCompanyId: byPlace.get(place.placeId) ?? null,
  }));
}

export const googleMapsResolvers = {
  GoogleMapsConfig: {
    hasBrowserKey: (row: ConfigRow) => Boolean(row.browserKey),
    browserKeyHint: (row: ConfigRow) => secretHint(row.browserKey),
    hasServerKey: (row: ConfigRow) => Boolean(row.serverKey),
    serverKeyHint: (row: ConfigRow) => secretHint(row.serverKey),
  },
  Query: {
    googleMapsConfigs: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await techStaff(ctx, 'VIEW');
      return withIds(await googleMapsConfigs.list());
    },
    /**
     * The browser key goes to signed-in CRM users only, because the Maps JavaScript API must run
     * in their browser with it. That makes it public to them by design: it is protected by its
     * HTTP-referrer and API restrictions in Google Cloud, never by being hidden.
     */
    googleMapsClientConfig: (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      crmDesk(ctx);
      return googleMapsConfigs.client();
    },
    searchLeadPlaces: async (
      _p: unknown,
      { input }: { input: LeadSearchInput },
      ctx: GraphQLContext,
    ) => {
      const user = crmDesk(ctx);
      if (input.query.trim().length < 2 || input.query.length > 200) {
        badRequest('Describe what to look for in 2–200 characters.');
      }
      await enforceLimit(searchLimiter, user.id, 'lead searches');
      const page = await searchText(await activeServerKey(), input);
      return { ...page, places: await withExisting(page.places) };
    },
  },
  Mutation: {
    createGoogleMapsConfig: async (
      _p: unknown,
      { input }: { input: GoogleMapsConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'CREATE');
      return withId(await googleMapsConfigs.create(input));
    },
    updateGoogleMapsConfig: async (
      _p: unknown,
      { id, input }: { id: string; input: GoogleMapsConfigInput },
      ctx: GraphQLContext,
    ) => {
      await techStaff(ctx, 'EDIT');
      return withId(await googleMapsConfigs.update(id, input));
    },
    testGoogleMapsConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'EDIT');
      return googleMapsConfigs.test(id);
    },
    deleteGoogleMapsConfig: async (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await techStaff(ctx, 'DELETE');
      return googleMapsConfigs.remove(id);
    },
    findLeadEmails: async (_p: unknown, { website }: { website: string }, ctx: GraphQLContext) => {
      const user = crmDesk(ctx);
      await enforceLimit(emailLimiter, user.id, 'website lookups');
      try {
        return await findWebsiteEmails(website);
      } catch (error) {
        if (error instanceof UnsafeUrlError) {
          return { emails: [], status: 'UNREACHABLE', message: error.message };
        }
        throw error;
      }
    },
    importLeadsToCrm: async (
      _p: unknown,
      { leads }: { leads: LeadImportInput[] },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Company', [ROLES.CRM], 'CREATE');
      const result = await importLeads(leads, await actorNameOf(ctx));
      await recordAudit(ctx, {
        action: 'IMPORT',
        module: 'Company',
        entityLabel: LEAD_SOURCE,
        summary: `Imported ${result.created} companies from ${LEAD_SOURCE} (${result.skipped} skipped)`,
      });
      return result;
    },
  },
};
