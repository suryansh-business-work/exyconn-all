import { isValidObjectId } from 'mongoose';
import { runAsPlatform } from '../../lib/tenant';
import { notFound } from '../../utils/errors';
import { seal } from '../../utils/secretBox';
import { MicrosoftAuthError, microsoftApp, type MicrosoftMailbox } from './microsoft.client';
import { MicrosoftMailAccountModel, type MicrosoftMailAccountDocument } from './microsoft.models';

/**
 * The Microsoft mailboxes connected to the operator's CRM. Platform rows (the callback that
 * creates them runs before any company is in scope); only the operator's CRM reaches them.
 */

const newestFirst = { connectedAt: -1 } as const;

export const listMicrosoftAccounts = () =>
  runAsPlatform(() =>
    MicrosoftMailAccountModel.find().sort(newestFirst).lean<MicrosoftMailAccountDocument[]>(),
  );

/** What the CRM sees of an account: never its token. */
export const presentMicrosoftAccount = (account: MicrosoftMailAccountDocument) => ({
  id: account._id.toHexString(),
  email: account.email,
  enabled: account.enabled,
  status: account.status,
  lastError: account.lastError,
  connectedAt: account.connectedAt,
  connectedByName: account.connectedByName,
  lastUsedAt: account.lastUsedAt,
});

/** Connected, or connected again: one row per mailbox, its token replaced. */
export const saveMicrosoftAccount = (email: string, refreshToken: string, actorName: string) =>
  runAsPlatform(() =>
    MicrosoftMailAccountModel.findOneAndUpdate(
      { email },
      {
        $set: {
          refreshToken: seal(refreshToken),
          status: 'CONNECTED',
          lastError: '',
          connectedAt: new Date(),
          connectedByName: actorName,
        },
        $setOnInsert: { email, enabled: true },
      },
      { upsert: true, new: true },
    ).lean<MicrosoftMailAccountDocument>(),
  );

async function updateAccount(id: string, fields: Partial<MicrosoftMailAccountDocument>) {
  const saved = await runAsPlatform(() =>
    MicrosoftMailAccountModel.findByIdAndUpdate(
      id,
      { $set: fields },
      { new: true },
    ).lean<MicrosoftMailAccountDocument | null>(),
  );
  if (!saved) notFound('Microsoft mailbox');
  return saved;
}

export const setMicrosoftAccountEnabled = (id: string, enabled: boolean) =>
  updateAccount(id, { enabled });

export async function disconnectMicrosoftAccount(id: string) {
  const removed = await runAsPlatform(() =>
    MicrosoftMailAccountModel.findByIdAndDelete(id).lean<MicrosoftMailAccountDocument | null>(),
  );
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
): Promise<void> {
  if ('error' in outcome) {
    const message = outcome.error instanceof Error ? outcome.error.message : 'No answer.';
    await updateAccount(id, {
      lastError: message,
      ...(outcome.error instanceof MicrosoftAuthError
        ? { status: 'NEEDS_RECONNECT' as const }
        : {}),
    });
    return;
  }
  await updateAccount(id, {
    lastError: '',
    lastUsedAt: new Date(),
    ...(outcome.refreshToken ? { refreshToken: seal(outcome.refreshToken) } : {}),
  });
}

/** Every mailbox the CRM sends from: enabled and still connected, with the app's client. */
export async function enabledMicrosoftMailboxes(): Promise<MicrosoftMailbox[]> {
  const app = await microsoftApp();
  const accounts = await runAsPlatform(() =>
    MicrosoftMailAccountModel.find({ enabled: true, status: 'CONNECTED' })
      .sort(newestFirst)
      .lean<MicrosoftMailAccountDocument[]>(),
  );
  return accounts.map((account) => ({
    id: account._id.toHexString(),
    email: account.email,
    refreshToken: account.refreshToken,
    clientId: app.clientId,
    clientSecret: app.clientSecret,
    tenant: app.tenant,
  }));
}

/** Whether a sender id names a connected Microsoft mailbox (rather than a Gmail one). */
export async function isMicrosoftAccount(id: string): Promise<boolean> {
  if (!isValidObjectId(id)) {
    return false;
  }
  return Boolean(await runAsPlatform(() => MicrosoftMailAccountModel.exists({ _id: id })));
}
