import { notFound } from '../../utils/errors';
import { SocialAccountModel } from './social.models';
import { SocialMediaPostModel } from './social-post.model';
import { PAGES_SCOPE } from './social.linkedin-pages';
import { appConfigs } from './social.service';

interface AccountRow {
  app: string;
  kind?: string | null;
  scopes?: string[] | null;
  active?: boolean | null;
}

/** Whether the LinkedIn app may ask for company pages: false once LinkedIn refused them. */
async function pagesAllowed(): Promise<boolean> {
  const linkedin = (await appConfigs()).find((config) => config.app === 'LINKEDIN');
  return !linkedin?.pagesRefused;
}

/**
 * An account as Marketing sees it. Rows from before pages and pausing lack those fields, so
 * a missing kind is a person and anything but `false` is active. A LinkedIn member connected
 * without the page scopes — an older connection — is asked to reconnect, unless LinkedIn
 * refused the scopes for the app, when reconnecting would not help.
 */
function present<T extends AccountRow>(row: T, pagesOn: boolean) {
  const kind = row.kind ?? 'PERSON';
  return {
    ...row,
    kind,
    active: row.active !== false,
    needsReconnect:
      pagesOn && row.app === 'LINKEDIN' && kind === 'PERSON' && !row.scopes?.includes(PAGES_SCOPE),
  };
}

const WITHOUT_TOKENS = '-accessToken -refreshToken';

export async function listAccounts() {
  const [rows, pagesOn] = await Promise.all([
    SocialAccountModel.find().select(WITHOUT_TOKENS).sort({ network: 1, name: 1 }).lean(),
    pagesAllowed(),
  ]);
  return rows.map((row) => present(row, pagesOn));
}

/**
 * Removes an account, and the pages that act through its token with it — without the
 * member's token a LinkedIn page cannot post. Returns what was removed, for the audit log.
 */
export async function disconnect(id: string) {
  const removed = await SocialAccountModel.findByIdAndDelete(id).select('name network').lean();
  if (!removed) notFound('Social account');
  const pages = await SocialAccountModel.find({ tokenAccountId: id }).select('name').lean();
  if (pages.length > 0) {
    await SocialAccountModel.deleteMany({ _id: { $in: pages.map((page) => page._id) } });
  }
  return { account: removed, pages: pages.map((page) => page.name) };
}

/**
 * Pauses an account or turns it back on. Paused, it is left out of Compose and of syncs, and
 * its scheduled posts are held where they are. Back on, the held posts lose their "held" note
 * and go out on the next tick.
 */
export async function setAccountActive(id: string, active: boolean) {
  const [updated, pagesOn] = await Promise.all([
    SocialAccountModel.findByIdAndUpdate(id, { $set: { active } }, { new: true })
      .select(WITHOUT_TOKENS)
      .lean(),
    pagesAllowed(),
  ]);
  if (!updated) notFound('Social account');
  if (active) {
    await SocialMediaPostModel.updateMany(
      { accountId: id, status: 'SCHEDULED' },
      { $set: { error: '' } },
    );
  }
  return present(updated, pagesOn);
}

/** The ids of accounts nothing is posted to or read from: paused, or no longer reachable. */
export async function idleAccountIds(): Promise<string[]> {
  const idle = await SocialAccountModel.find({
    $or: [{ active: false }, { disconnectedAt: { $ne: null } }],
  })
    .select('_id')
    .lean();
  return idle.map((account) => account._id.toHexString());
}

/** The filter for accounts that are on and reachable — what syncs and Compose use. */
export const LIVE_ACCOUNT = { active: { $ne: false }, disconnectedAt: null } as const;
