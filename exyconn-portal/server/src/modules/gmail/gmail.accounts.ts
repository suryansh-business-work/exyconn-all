import { runForOrganization } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { GmailAuthError, gmailClient, gmailClientConfig, type Mailbox } from './gmail.client';
import {
  CrmEmailMessageModel,
  GmailAccountModel,
  GmailConfigModel,
  type GmailAccountDocument,
} from './gmail.models';

/**
 * The Gmail mailboxes connected to a company's CRM. Each row belongs to one company, so every
 * read and write here runs in the caller's company scope; only Google's callback, which has no
 * session, names the company itself (the one recorded on the OAuth state).
 */

const newestFirst = { connectedAt: -1 } as const;

/**
 * The company's CRM mailboxes: not one a person connected for their own email. Rows saved
 * before personal mailboxes existed have no owner field, which `null` matches too.
 */
export const ORG_MAILBOXES = { ownerUserId: null } as const;

/** Which rows a call may touch: the company's CRM mailboxes, or one person's own. */
export type MailboxScope = Readonly<{ ownerUserId: string | null }>;

export const listGmailAccounts = () =>
  GmailAccountModel.find(ORG_MAILBOXES).sort(newestFirst).lean<GmailAccountDocument[]>();

/** What the CRM sees of an account: never its token. */
export const presentGmailAccount = (account: GmailAccountDocument) => ({
  id: account._id.toHexString(),
  email: account.email,
  enabled: account.enabled,
  status: account.status,
  lastError: account.lastError,
  // Rows saved before the field existed have none (lean skips defaults).
  lastErrorAt: account.lastErrorAt ?? null,
  connectedAt: account.connectedAt,
  connectedByName: account.connectedByName,
  lastSyncAt: account.lastSyncAt,
});

/**
 * Connected, or connected again: one row per Google account in the company that connected it
 * (and per owner, for a personal mailbox), its token replaced.
 */
export const saveConnectedAccount = (
  organizationId: string,
  email: string,
  sealedToken: string,
  actorName: string,
  ownerUserId: string | null = null,
) =>
  runForOrganization(organizationId, () =>
    GmailAccountModel.findOneAndUpdate(
      { email, ownerUserId },
      {
        $set: {
          refreshToken: sealedToken,
          status: 'CONNECTED',
          lastError: '',
          lastErrorAt: null,
          connectedAt: new Date(),
          connectedByName: actorName,
        },
        $setOnInsert: { email, enabled: true, ownerUserId },
      },
      { upsert: true, new: true },
    ).lean<GmailAccountDocument>(),
  );

/** Updates one account; `scope` limits it to CRM rows or one owner's (none: any, internal). */
async function updateAccount(
  id: string,
  fields: Partial<GmailAccountDocument>,
  scope: MailboxScope | Record<string, never> = ORG_MAILBOXES,
) {
  const saved = await GmailAccountModel.findOneAndUpdate(
    { _id: id, ...scope },
    { $set: fields },
    { new: true },
  ).lean<GmailAccountDocument | null>();
  if (!saved) notFound('Gmail account');
  return saved;
}

export const setGmailAccountEnabled = (id: string, enabled: boolean) =>
  updateAccount(id, { enabled });

export async function disconnectGmailAccount(
  id: string,
  scope: MailboxScope = ORG_MAILBOXES,
): Promise<GmailAccountDocument> {
  const removed = await GmailAccountModel.findOneAndDelete({
    _id: id,
    ...scope,
  }).lean<GmailAccountDocument | null>();
  if (!removed) notFound('Gmail account');
  return removed;
}

/** Records how the last call to the account went; an auth refusal asks for a reconnect. */
export async function noteAccountOutcome(
  id: string,
  error: unknown,
): Promise<GmailAccountDocument> {
  // By id alone: the outcome of a call is kept on whichever mailbox made it, CRM or personal.
  if (error === null) {
    return updateAccount(id, { lastError: '', lastErrorAt: null, lastSyncAt: new Date() }, {});
  }
  const message = error instanceof Error ? error.message : 'Gmail did not answer.';
  return updateAccount(
    id,
    {
      lastError: message,
      lastErrorAt: new Date(),
      ...(error instanceof GmailAuthError ? { status: 'NEEDS_RECONNECT' as const } : {}),
    },
    {},
  );
}

/**
 * Runs one call as the mailbox and, when it fails, keeps the failure on the mailbox before
 * passing it on: the CRM's sends and a person's own go through this alike.
 */
export async function withMailboxOutcome<T>(id: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    await noteAccountOutcome(id, error);
    throw error;
  }
}

/**
 * Checks one mailbox works right now by reading its own address with its stored connection.
 * A pass clears the last error (and a reconnect flag); a failure is kept on the mailbox, as
 * any other failed call is, so the table shows it.
 */
export async function testGmailAccount(
  id: string,
  scope: MailboxScope = ORG_MAILBOXES,
): Promise<GmailAccountDocument> {
  const config = await gmailClientConfig();
  const account = await GmailAccountModel.findOne({
    _id: id,
    ...scope,
  }).lean<GmailAccountDocument | null>();
  if (!account) notFound('Gmail account');
  try {
    await gmailClient.profile(mailboxOf(config, account));
  } catch (error) {
    return noteAccountOutcome(id, error);
  }
  return updateAccount(id, { status: 'CONNECTED', lastError: '', lastErrorAt: null }, scope);
}

/** The client and an account together: what every Gmail call is made with. */
export const mailboxOf = (
  config: { clientId: string; clientSecret: string },
  account: GmailAccountDocument,
): Mailbox & { id: string } => ({
  id: account._id.toHexString(),
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  refreshToken: account.refreshToken,
  email: account.email,
});

export type AccountMailbox = ReturnType<typeof mailboxOf>;

/** Every account the company's CRM reads and sends from: enabled and still connected. */
export async function enabledMailboxes(): Promise<AccountMailbox[]> {
  const config = await gmailClientConfig();
  const accounts = await GmailAccountModel.find({
    enabled: true,
    status: 'CONNECTED',
    ...ORG_MAILBOXES,
  })
    .sort(newestFirst)
    .lean<GmailAccountDocument[]>();
  return accounts.map((account) => mailboxOf(config, account));
}

/** The account an email is sent from: it has to be one the CRM may use right now. */
export async function sendingMailbox(accountId: string): Promise<AccountMailbox> {
  const mailbox = (await enabledMailboxes()).find((candidate) => candidate.id === accountId);
  if (!mailbox) {
    badRequest('Choose a connected Gmail account that is turned on for the CRM.');
  }
  return mailbox;
}

/**
 * Releases before multi-account kept one mailbox on the Tech config row. Moved into an
 * account once (boot runOnce ledger); the old fields stay so a rollback still connects.
 */
export async function migrateLegacyGmailConnection(): Promise<void> {
  const legacy = await GmailConfigModel.findOne({ key: 'default' }).lean();
  if (!legacy?.refreshToken || !legacy.connectedEmail) {
    return;
  }
  const account = await GmailAccountModel.findOneAndUpdate(
    { email: legacy.connectedEmail, ...ORG_MAILBOXES },
    {
      $setOnInsert: {
        email: legacy.connectedEmail,
        refreshToken: legacy.refreshToken,
        enabled: true,
        status: 'CONNECTED',
        lastError: legacy.lastError,
        connectedAt: legacy.connectedAt ?? new Date(),
        connectedByName: legacy.updatedByName,
      },
    },
    { upsert: true, new: true },
  ).lean<GmailAccountDocument>();
  // The mail it synced was all this mailbox's; say so, so threads group by account.
  await CrmEmailMessageModel.updateMany(
    { accountId: { $in: ['', null] } },
    { $set: { accountId: account._id.toHexString(), mailbox: account.email } },
  );
}
