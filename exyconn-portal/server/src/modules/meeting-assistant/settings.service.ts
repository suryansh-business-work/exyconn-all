import { MaSettingsModel, type MaSettingsDocument } from './models';
import { MaMeetingModel } from './models';
import { badRequest } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';

const KEY = 'global';

export type MaSettingsInput = Omit<
  MaSettingsDocument,
  'key' | 'updatedByName' | 'createdAt' | 'updatedAt'
>;

/** This company's settings, created with the defaults the first time anyone reads them. */
export async function getMaSettings(): Promise<MaSettingsDocument> {
  const existing = await MaSettingsModel.findOne({ key: KEY }).lean<MaSettingsDocument>();
  if (existing) {
    return existing;
  }
  return (await MaSettingsModel.findOneAndUpdate(
    { key: KEY },
    { $setOnInsert: { key: KEY } },
    { upsert: true, new: true },
  ).lean<MaSettingsDocument>())!;
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
  await getMaSettings();
  return MaSettingsModel.findOneAndUpdate(
    { key: KEY },
    {
      $set: {
        ...input,
        allowedUserIds: [...new Set(input.allowedUserIds)],
        emailAllowedDomains,
        defaultRecipients,
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
