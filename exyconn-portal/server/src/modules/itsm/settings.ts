import { assertPermission, PERMISSION_MODULES } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';
import { ItSettingsModel } from './models';

const SETTINGS_MODULE = 'ItSettings';
PERMISSION_MODULES.add(SETTINGS_MODULE);
const itOnly = [ROLES.IT];
const KEY = 'global';

export interface ItSettingsInput {
  applications: string[];
  onboardingApplications: string[];
  ticketTopics: string[];
  warrantyWarningDays: number;
  renewalWarningDays: number;
  certificateWarningDays: number;
}

/** Trims, drops blanks and removes case-insensitive duplicates, keeping the first spelling. */
function cleanList(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (value === '' || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

/** This company's IT settings, created with the defaults the first time anyone reads them. */
export async function getItSettings() {
  const existing = await ItSettingsModel.findOne({ key: KEY }).lean();
  if (existing) {
    return existing;
  }
  return (await ItSettingsModel.create({ key: KEY })).toObject();
}

export const itSettingsResolvers = {
  Query: {
    itSettings: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, SETTINGS_MODULE, itOnly, 'VIEW');
      return getItSettings();
    },
  },
  Mutation: {
    updateItSettings: async (
      _p: unknown,
      { input }: { input: ItSettingsInput },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, SETTINGS_MODULE, itOnly, 'EDIT');
      const applications = cleanList(input.applications);
      const onboardingApplications = cleanList(input.onboardingApplications);
      const known = new Set(applications.map((app) => app.toLowerCase()));
      if (onboardingApplications.some((app) => !known.has(app.toLowerCase()))) {
        badRequest('Every onboarding application must also be in the applications list');
      }
      await getItSettings();
      return ItSettingsModel.findOneAndUpdate(
        { key: KEY },
        {
          ...input,
          applications,
          onboardingApplications,
          ticketTopics: cleanList(input.ticketTopics),
        },
        { new: true, runValidators: true },
      ).lean();
    },
  },
};
