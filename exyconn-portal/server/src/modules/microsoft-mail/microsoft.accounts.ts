import { isValidObjectId } from 'mongoose';
import { runForOrganization } from '../../lib/tenant';
import { notFound } from '../../utils/errors';
import { seal } from '../../utils/secretBox';
import {
  MicrosoftAuthError,
  mailboxAddress,
  microsoftApp,
  refreshMailbox,
  type MicrosoftMailbox,
} from './microsoft.client';
import { ORG_MAILBOXES, type MailboxScope } from '../gmail/gmail.accounts';
import { MicrosoftMailAccountModel, type MicrosoftMailAccountDocument } from './microsoft.models';

/**
 * The Microsoft mailboxes connected to a company's CRM. Each row belongs to one company, so
 * every read and write here runs in the caller's company scope; only Microsoft's callback,
 * which has no session, names the company itself (the one recorded on the OAuth state).
 */

const newestFirst = { connectedAt: -1 } as const;

export const listMicrosoftAccounts = () =>
  MicrosoftMailAccountModel.find(ORG_MAILBOXES)
    .sort(newestFirst)
    .lean<MicrosoftMailAccountDocument[]>();

/** What the CRM sees of an account: never its token. */
export const presentMicrosoftAccount = (account: MicrosoftMailAccountDocument) => ({
  id: account._id.toHexString(),
  email: account.email,
  enabled: account.enabled,
  status: account.status,
  lastError: account.lastError,
  // Rows saved before the field existed have none (lean skips defaults).
  lastErrorAt: account.lastErrorAt ?? null,
  connectedAt: account.connectedAt,
  connectedByName: account.connectedByName,
  lastUsedAt: account.lastUsedAt,
});

/**
 * Connected, or connected again: one row per mailbox in the company (and per owner, for a
 * personal mailbox), its token replaced.
 */
export const saveMicrosoftAccount = (
  organizationId: string,
  email: string,
  refreshToken: string,
  actorName: string,
  ownerUserId: string | null = null,
) =>
  runForOrganization(organizationId, () =>
    MicrosoftMailAccountModel.findOneAndUpdate(
      { email, ownerUserId },
      {
        $set: {
          refreshToken: seal(refreshToken),
          status: 'CONNECTED',
          lastError: '',
          lastErrorAt: null,
          connectedAt: new Date(),
          connectedByName: actorName,
        },
        $setOnInsert: { email, enabled: true, ownerUserId },
      },
      { upsert: true, new: true },
    ).lean<MicrosoftMailAccountDocument>(),
  );

/** Updates one mailbox; `scope` limits it to CRM rows or one owner's (none: any, internal). */
async function updateAccount(
  id: string,
  fields: Partial<MicrosoftMailAccountDocument>,
  scope: MailboxScope | Record<string, never> = ORG_MAILBOXES,
) {
  const saved = await MicrosoftMailAccountModel.findOneAndUpdate(
    { _id: id, ...scope },
    { $set: fields },
    { new: true },
  ).lean<MicrosoftMailAccountDocument | null>();
  if (!saved) notFound('Microsoft mailbox');
  return saved;
}

export const setMicrosoftAccountEnabled = (id: string, enabled: boolean) =>
  updateAccount(id, { enabled });

export async function disconnectMicrosoftAccount(id: string, scope: MailboxScope = ORG_MAILBOXES) {
  const removed = await MicrosoftMailAccountModel.findOneAndDelete({
    _id: id,
    ...scope,
  }).lean<MicrosoftMailAccountDocument | null>();
  if (!removed) notFound('Microsoft mailbox');
  return removed;
}

/**
 * Records how the last call went; an auth refusal asks for a reconnect. A rotated refresh
 * token from a successful call replaces the stored one.
 */
export async function noteMicrosoftOutcome(
  id: string,
  outcome: { error: unknown } | { refreshToken?: string },
): Promise<MicrosoftMailAccountDocument> {
  // By id alone: the outcome of a call is kept on whichever mailbox made it, CRM or personal.
  if ('error' in outcome) {
    const message = outcome.error instanceof Error ? outcome.error.message : 'No answer.';
    return updateAccount(
      id,
      {
        lastError: message,
        lastErrorAt: new Date(),
        ...(outcome.error instanceof MicrosoftAuthError
          ? { status: 'NEEDS_RECONNECT' as const }
          : {}),
      },
      {},
    );
  }
  return updateAccount(
    id,
    {
      lastError: '',
      lastErrorAt: null,
      lastUsedAt: new Date(),
      ...(outcome.refreshToken ? { refreshToken: seal(outcome.refreshToken) } : {}),
    },
    {},
  );
}

/**
 * Checks one mailbox works right now: a fresh token, then its own address from Graph. A pass
 * clears the last error (and a reconnect flag) and keeps a rotated token; a failure is kept on
 * the mailbox, as any other failed call is, so the table shows it.
 */
export async function testMicrosoftAccount(
  id: string,
  scope: MailboxScope = ORG_MAILBOXES,
): Promise<MicrosoftMailAccountDocument> {
  const app = await microsoftApp();
  const account = await MicrosoftMailAccountModel.findOne({
    _id: id,
    ...scope,
  }).lean<MicrosoftMailAccountDocument | null>();
  if (!account) notFound('Microsoft mailbox');
  try {
    const tokens = await refreshMailbox({
      id,
      email: account.email,
      refreshToken: account.refreshToken,
      clientId: app.clientId,
      clientSecret: app.clientSecret,
      tenant: app.tenant,
    });
    await mailboxAddress(tokens.access_token);
    return await updateAccount(
      id,
      {
        status: 'CONNECTED',
        lastError: '',
        lastErrorAt: null,
        ...(tokens.refresh_token ? { refreshToken: seal(tokens.refresh_token) } : {}),
      },
      scope,
    );
  } catch (error) {
    return noteMicrosoftOutcome(id, { error });
  }
}

/** Every mailbox the company's CRM sends from: enabled and connected, with the app's client. */
export async function enabledMicrosoftMailboxes(): Promise<MicrosoftMailbox[]> {
  const app = await microsoftApp();
  const accounts = await MicrosoftMailAccountModel.find({
    enabled: true,
    status: 'CONNECTED',
    ...ORG_MAILBOXES,
  })
    .sort(newestFirst)
    .lean<MicrosoftMailAccountDocument[]>();
  return accounts.map((account) => microsoftMailboxOf(app, account));
}

/** The app and an account together: what every Graph call is made with. */
export const microsoftMailboxOf = (
  app: Pick<MicrosoftMailbox, 'clientId' | 'clientSecret' | 'tenant'>,
  account: MicrosoftMailAccountDocument,
): MicrosoftMailbox => ({
  id: account._id.toHexString(),
  email: account.email,
  refreshToken: account.refreshToken,
  clientId: app.clientId,
  clientSecret: app.clientSecret,
  tenant: app.tenant,
});

/** Whether a sender id names one of the company's Microsoft mailboxes (rather than a Gmail one). */
export async function isMicrosoftAccount(id: string): Promise<boolean> {
  if (!isValidObjectId(id)) {
    return false;
  }
  return Boolean(await MicrosoftMailAccountModel.exists({ _id: id, ...ORG_MAILBOXES }));
}
