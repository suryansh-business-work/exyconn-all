import { createHash } from 'node:crypto';
import { MarketingUnsubscribeTokenModel } from './unsubscribe-token.model';
import { MarketingPreferenceModel, PreferenceCategoryModel } from './preference.model';
import { MarketingSuppressionModel } from './suppression.model';
import { suppress, unsubscribeLimiter } from './marketing.suppression';
import { ContactModel } from '../crm/contact.model';
import { PREVIEW_TOKEN } from './campaign.preview';
import { recordSystemAudit } from '../audit';
import { runAsPlatform, runForOrganization } from '../../lib/tenant';
import { createLimiter } from '../../lib/rateLimiter';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { maskEmail } from '../../utils/maskEmail';

const INVALID_LINK = 'This link is not valid. Use the link from a recent email.';
const PREFERENCE_UPDATES_PER_HOUR = 30;

/** The address and campaign behind one recipient link. */
export interface RecipientToken {
  email: string;
  campaignId: string;
}

/** Per-caller limit on the public preference endpoints, like the unsubscribe one. */
export const preferenceLimiter = createLimiter({
  keyPrefix: 'email_preferences_ip',
  points: PREFERENCE_UPDATES_PER_HOUR,
  durationSec: 60 * 60,
});

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/**
 * Runs `work` inside the company a recipient link belongs to. Public links arrive with no
 * company in scope, so the opaque token is looked up platform-wide — its hash is unique — and
 * everything after happens confined to that one company. An unknown token is null.
 */
export async function withRecipientToken<T>(
  token: string,
  work: (recipient: RecipientToken) => Promise<T>,
): Promise<T | null> {
  const row = await runAsPlatform(() =>
    MarketingUnsubscribeTokenModel.findOne({ tokenHash: hashToken(token) })
      .select('email campaignId organizationId')
      .lean<{ email: string; campaignId: string; organizationId?: unknown }>(),
  );
  if (!row?.organizationId) {
    return null;
  }
  return runForOrganization(String(row.organizationId), () =>
    work({ email: row.email, campaignId: row.campaignId }),
  );
}

/** The address as the page shows it: enough to recognise, not enough to harvest. */
const visibleAddress = (email: string) => maskEmail(email);

async function preferencesOf(email: string) {
  const [categories, preference, suppressed] = await Promise.all([
    PreferenceCategoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    MarketingPreferenceModel.findOne({ email }).lean(),
    MarketingSuppressionModel.exists({ email }),
  ]);
  const optedOut = new Set(preference?.optedOutCategoryIds ?? []);
  return {
    email: visibleAddress(email),
    preview: false,
    unsubscribedAll: Boolean(suppressed),
    categories: categories.map((category) => ({
      id: String(category._id),
      name: category.name,
      description: category.description,
      subscribed: !optedOut.has(String(category._id)),
    })),
  };
}

/** What a preview link shows: nothing real, and nothing it can save. */
const PREVIEW_PREFERENCES = {
  email: '',
  preview: true,
  unsubscribedAll: false,
  categories: [],
};

/** The recipient's current choices. Public; the token is the only credential. */
export async function preferencesByToken(token: string) {
  if (token === PREVIEW_TOKEN) {
    return PREVIEW_PREFERENCES;
  }
  const found = await withRecipientToken(token, (recipient) => preferencesOf(recipient.email));
  if (!found) {
    badRequest(INVALID_LINK);
  }
  return found;
}

export interface PreferenceUpdate {
  optedOutCategoryIds: string[];
  unsubscribeAll: boolean;
}

/**
 * Saves the recipient's choices. Only real, active categories are kept; saving the same
 * choices twice changes nothing. Unsubscribing from everything goes onto the suppression list,
 * which overrides every category — and turning categories back on never lifts it.
 */
async function savePreferences(recipient: RecipientToken, update: PreferenceUpdate) {
  const active = await PreferenceCategoryModel.find({
    _id: { $in: update.optedOutCategoryIds },
    isActive: true,
  })
    .select('_id')
    .lean();
  const optedOutCategoryIds = active
    .map((category) => String(category._id))
    .sort((a, b) => a.localeCompare(b));
  await MarketingPreferenceModel.updateOne(
    { email: recipient.email },
    { $set: { email: recipient.email, optedOutCategoryIds } },
    { upsert: true },
  );
  if (update.unsubscribeAll) {
    await suppress(
      recipient.email,
      'UNSUBSCRIBED',
      `campaign:${recipient.campaignId}`,
      'SUBSCRIBER',
    );
  }
  await recordSystemAudit({
    action: 'UPDATE',
    module: 'MarketingPreference',
    entityLabel: recipient.email,
    summary: update.unsubscribeAll
      ? `Unsubscribed from all marketing (campaign ${recipient.campaignId})`
      : `Preferences saved: ${optedOutCategoryIds.length} categor(ies) off (campaign ${recipient.campaignId})`,
  });
  logger.info(`Email preferences saved for ${maskEmail(recipient.email)}`);
  return preferencesOf(recipient.email);
}

export async function updatePreferencesByToken(
  token: string,
  update: PreferenceUpdate,
  caller: string,
) {
  if (!(await preferenceLimiter.allow(caller))) {
    badRequest('Too many attempts. Try again shortly.');
  }
  if (token === PREVIEW_TOKEN) {
    badRequest('This is a preview link — nothing was saved.');
  }
  const saved = await withRecipientToken(token, (recipient) => savePreferences(recipient, update));
  if (!saved) {
    badRequest(INVALID_LINK);
  }
  return saved;
}

/**
 * Honours an unsubscribe — the confirm button on the unsubscribe page, or a mail client's
 * one-click POST. Idempotent: the address is suppressed once however often it is asked.
 * Public and unauthenticated: the person asking is a recipient, and the token proves which
 * address is theirs. A preview token never unsubscribes anyone.
 */
export async function unsubscribeByToken(token: string, caller: string): Promise<boolean> {
  if (!(await unsubscribeLimiter.allow(caller))) {
    logger.warn('Unsubscribe rate-limited');
    badRequest('Too many attempts. Try again shortly.');
  }
  if (token === PREVIEW_TOKEN) {
    return true;
  }
  const done = await withRecipientToken(token, async (recipient) => {
    await suppress(
      recipient.email,
      'UNSUBSCRIBED',
      `campaign:${recipient.campaignId}`,
      'SUBSCRIBER',
    );
    // The CRM is where a salesperson looks before writing to somebody, so the answer has to
    // be visible there too — not only inside the marketing module's own list.
    await ContactModel.updateMany({ email: recipient.email }, { status: 'UNSUBSCRIBED' });
    logger.info(`Unsubscribed ${maskEmail(recipient.email)} from marketing`);
    return true;
  });
  if (!done) {
    badRequest(INVALID_LINK);
  }
  return true;
}
