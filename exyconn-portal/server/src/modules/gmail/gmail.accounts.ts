import { runAsPlatform } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { GmailAuthError, gmailClientConfig, type Mailbox } from './gmail.client';
import {
  CrmEmailMessageModel,
  GmailAccountModel,
  GmailConfigModel,
  type GmailAccountDocument,
} from './gmail.models';

/**
 * The Gmail mailboxes connected to the operator's CRM. Each is a platform row (the callback
 * that creates it runs before any company is in scope); only the operator's CRM reaches them.
 */

const newestFirst = { connectedAt: -1 } as const;

export const listGmailAccounts = () =>
  runAsPlatform(() => GmailAccountModel.find().sort(newestFirst).lean<GmailAccountDocument[]>());

/** What the CRM sees of an account: never its token. */
export const presentGmailAccount = (account: GmailAccountDocument) => ({
  id: String(account._id),
  email: account.email,
  enabled: account.enabled,
  status: account.status,
  lastError: account.lastError,
  connectedAt: account.connectedAt,
  connectedByName: account.connectedByName,
  lastSyncAt: account.lastSyncAt,
});

/** Connected, or connected again: one row per Google account, its token replaced. */
export const saveConnectedAccount = (email: string, sealedToken: string, actorName: string) =>
  runAsPlatform(() =>
    GmailAccountModel.findOneAndUpdate(
      { email },
      {
        $set: {
          refreshToken: sealedToken,
          status: 'CONNECTED',
          lastError: '',
          connectedAt: new Date(),
          connectedByName: actorName,
        },
        $setOnInsert: { email, enabled: true },
      },
      { upsert: true, new: true },
    ).lean<GmailAccountDocument>(),
  );

async function updateAccount(id: string, fields: Partial<GmailAccountDocument>) {
  const saved = await runAsPlatform(() =>
    GmailAccountModel.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true },
    ).lean<GmailAccountDocument | null>(),
  );
  if (!saved) notFound('Gmail account');
  return saved;
}

export const setGmailAccountEnabled = (id: string, enabled: boolean) =>
  updateAccount(id, { enabled });

export async function disconnectGmailAccount(id: string): Promise<GmailAccountDocument> {
  const removed = await runAsPlatform(() =>
    GmailAccountModel.findByIdAndDelete(id).lean<GmailAccountDocument | null>(),
  );
  if (!removed) notFound('Gmail account');
  return removed;
}

/** Records how the last call to the account went; an auth refusal asks for a reconnect. */
export async function noteAccountOutcome(id: string, error: unknown): Promise<void> {
  if (error === null) {
    await updateAccount(id, { lastError: '', lastSyncAt: new Date() });
    return;
  }
  const message = error instanceof Error ? error.message : 'Gmail did not answer.';
  await updateAccount(id, {
    lastError: message,
    ...(error instanceof GmailAuthError ? { status: 'NEEDS_RECONNECT' as const } : {}),
  });
}

/** The client and an account together: what every Gmail call is made with. */
const mailboxOf = (
  config: { clientId: string; clientSecret: string },
  account: GmailAccountDocument,
): Mailbox & { id: string } => ({
  id: String(account._id),
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  refreshToken: account.refreshToken,
  email: account.email,
});

export type AccountMailbox = ReturnType<typeof mailboxOf>;

/** Every account the CRM reads and sends from: enabled and still connected. */
export async function enabledMailboxes(): Promise<AccountMailbox[]> {
  const config = await gmailClientConfig();
  const accounts = await runAsPlatform(() =>
    GmailAccountModel.find({ enabled: true, status: 'CONNECTED' })
      .sort(newestFirst)
      .lean<GmailAccountDocument[]>(),
  );
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
    { email: legacy.connectedEmail },
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
    { $set: { accountId: String(account._id), mailbox: account.email } },
  );
}
