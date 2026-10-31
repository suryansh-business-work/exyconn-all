import { MaSettingsModel, type MaSettingsDocument } from './models';
import { MaMeetingModel } from './models';
import { badRequest } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';

const KEY = 'global';

export type MaSettingsInput = Omit<
  MaSettingsDocument,
  'key' | 'updatedByName' | 'createdAt' | 'updatedAt'
>;

const DUPLICATE_KEY = 11000;

/**
 * This company's settings, created with the defaults the first time anyone reads them. Two
 * first reads at once (two tabs starting a call) both upsert, and the loser hits the unique
 * index: the winner's row is then the settings, so it is read instead of failing the call.
 */
export async function getMaSettings(): Promise<MaSettingsDocument> {
  const existing = await MaSettingsModel.findOne({ key: KEY }).lean<MaSettingsDocument>();
  if (existing) {
    // A row saved before a setting existed lacks it, and lean() skips defaults: hydrate fills them.
    return MaSettingsModel.hydrate(existing).toObject<MaSettingsDocument>();
  }
  try {
    return (await MaSettingsModel.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY } },
      { upsert: true, new: true },
    ).lean<MaSettingsDocument>())!;
  } catch (error) {
    if ((error as { code?: number }).code !== DUPLICATE_KEY) {
      throw error;
    }
    return (await MaSettingsModel.findOne({ key: KEY }).lean<MaSettingsDocument>())!;
  }
}

/** Trimmed, lower-cased, de-duplicated and blank-free. */
function cleanList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

/** The same shape as @exyconn/regex DOMAIN, which the settings form checks first. */
const DOMAIN = /^[a-z\d-]+(?:\.[a-z\d-]+)+$/i;

/** Every default recipient is a real address in one of the allowed domains. */
function checkRecipients(recipients: string[], domains: string[]): void {
  for (const domain of domains) {
    if (!DOMAIN.test(domain)) {
      badRequest(`"${domain}" is not a domain name.`);
    }
  }
  for (const recipient of recipients) {
    if (!isEmailAddress(recipient)) {
      badRequest(`"${recipient}" is not an email address.`);
    }
    const domain = recipient.split('@')[1];
    if (!domains.includes(domain)) {
      badRequest(`${recipient} is outside the allowed email domains.`);
    }
  }
}

export async function updateMaSettings(input: MaSettingsInput, actorName: string) {
  const emailAllowedDomains = cleanList(input.emailAllowedDomains);
  const defaultRecipients = cleanList(input.defaultRecipients);
  checkRecipients(defaultRecipients, emailAllowedDomains);
  const botName = input.botName.trim();
  if (botName.length === 0 || botName.length > 60) {
    badRequest('The bot name must be 1 to 60 characters.');
  }
  await getMaSettings();
  return MaSettingsModel.findOneAndUpdate(
    { key: KEY },
    {
      $set: {
        ...input,
        allowedUserIds: [...new Set(input.allowedUserIds)],
        emailAllowedDomains,
        defaultRecipients,
        botName,
        updatedByName: actorName,
      },
    },
    { new: true, runValidators: true },
  ).lean<MaSettingsDocument>();
}

/** The first instant of the calendar month `now` is in, in UTC. */
export function monthStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** What meetings have cost the company in AI spend so far this month. */
export async function monthSpendUsd(now = new Date()): Promise<number> {
  const [row] = await MaMeetingModel.aggregate<{ total: number }>([
    { $match: { startedAt: { $gte: monthStart(now) } } },
    { $group: { _id: null, total: { $sum: '$costUsd' } } },
  ]);
  return row?.total ?? 0;
}

/** Refuses more AI work once the company's monthly meeting budget is spent. */
export async function withinMonthlyBudget(settings: MaSettingsDocument): Promise<boolean> {
  if (settings.monthlyBudgetUsd <= 0) {
    return true;
  }
  return (await monthSpendUsd()) < settings.monthlyBudgetUsd;
}
