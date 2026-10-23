import { isValidObjectId } from 'mongoose';
import { forbidden } from '../../utils/errors';
import {
  disconnectGmailAccount,
  mailboxOf,
  testGmailAccount,
  type AccountMailbox,
} from '../gmail/gmail.accounts';
import { gmailClientConfig } from '../gmail/gmail.client';
import { GmailAccountModel, type GmailAccountDocument } from '../gmail/gmail.models';
import {
  disconnectMicrosoftAccount,
  microsoftMailboxOf,
  testMicrosoftAccount,
} from '../microsoft-mail/microsoft.accounts';
import { microsoftApp, type MicrosoftMailbox } from '../microsoft-mail/microsoft.client';
import {
  MicrosoftMailAccountModel,
  type MicrosoftMailAccountDocument,
} from '../microsoft-mail/microsoft.models';
import type { MailboxProvider } from './my-mailboxes.default';

/**
 * A person's own mailboxes (Settings > Mailboxes). Every call is confined to the caller's rows
 * in their company: a CRM mailbox, or anybody else's, is refused as not theirs.
 */

const NOT_YOURS = 'That mailbox is not one of yours.';

type AccountRow = GmailAccountDocument | MicrosoftMailAccountDocument;

/** What the person sees of a mailbox: never its token. */
export interface MyMailbox {
  id: string;
  provider: MailboxProvider;
  email: string;
  status: AccountRow['status'];
  lastError: string;
  lastErrorAt: Date | null;
  connectedAt: Date | null;
  isDefault: boolean;
}

const owned = (ownerUserId: string) => ({ ownerUserId });

const present = (provider: MailboxProvider, row: AccountRow): MyMailbox => ({
  id: row._id.toHexString(),
  provider,
  email: row.email,
  status: row.status,
  lastError: row.lastError,
  lastErrorAt: row.lastErrorAt ?? null,
  connectedAt: row.connectedAt ?? null,
  isDefault: row.isDefault ?? false,
});

const connectedTime = (mailbox: MyMailbox) => mailbox.connectedAt?.getTime() ?? 0;

/**
 * The caller's mailboxes across both providers, the default first and the rest newest first.
 * The default is the one they chose, else their newest.
 */
export async function listMyMailboxes(ownerUserId: string): Promise<MyMailbox[]> {
  const [gmail, microsoft] = await Promise.all([
    GmailAccountModel.find(owned(ownerUserId)).lean<GmailAccountDocument[]>(),
    MicrosoftMailAccountModel.find(owned(ownerUserId)).lean<MicrosoftMailAccountDocument[]>(),
  ]);
  const all = [
    ...gmail.map((row) => present('GMAIL', row)),
    ...microsoft.map((row) => present('MICROSOFT', row)),
  ].sort((a, b) => connectedTime(b) - connectedTime(a));
  const chosen = all.find((mailbox) => mailbox.isDefault) ?? all[0];
  return all
    .map((mailbox) => ({ ...mailbox, isDefault: mailbox === chosen }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

/** One of the caller's mailboxes as they see it; refused when it is not theirs. */
export async function myMailbox(ownerUserId: string, id: string): Promise<MyMailbox> {
  const found = (await listMyMailboxes(ownerUserId)).find((mailbox) => mailbox.id === id);
  if (!found) {
    forbidden(NOT_YOURS);
  }
  return found;
}

/** Which provider holds the caller's mailbox `id`; refuses anything that is not theirs. */
export async function ownMailbox(ownerUserId: string, id: string): Promise<MailboxProvider> {
  if (!isValidObjectId(id)) {
    forbidden(NOT_YOURS);
  }
  const mine = { _id: id, ...owned(ownerUserId) };
  const [gmail, microsoft] = await Promise.all([
    GmailAccountModel.exists(mine),
    MicrosoftMailAccountModel.exists(mine),
  ]);
  if (gmail) {
    return 'GMAIL';
  }
  if (microsoft) {
    return 'MICROSOFT';
  }
  forbidden(NOT_YOURS);
}

/** Checks one of the caller's mailboxes works now, with the CRM's own test of that provider. */
export async function testMyMailbox(ownerUserId: string, id: string): Promise<MyMailbox> {
  const provider = await ownMailbox(ownerUserId, id);
  const scope = owned(ownerUserId);
  if (provider === 'GMAIL') {
    await testGmailAccount(id, scope);
  } else {
    await testMicrosoftAccount(id, scope);
  }
  return myMailbox(ownerUserId, id);
}

/** Removes one of the caller's mailboxes and its token; resolves to its address. */
export async function disconnectMyMailbox(ownerUserId: string, id: string): Promise<string> {
  const provider = await ownMailbox(ownerUserId, id);
  const scope = owned(ownerUserId);
  const removed =
    provider === 'GMAIL'
      ? await disconnectGmailAccount(id, scope)
      : await disconnectMicrosoftAccount(id, scope);
  return removed.email;
}

/** Makes one of the caller's mailboxes the one new email goes from. */
export async function setDefaultMyMailbox(ownerUserId: string, id: string): Promise<MyMailbox> {
  const provider = await ownMailbox(ownerUserId, id);
  const clear = { $set: { isDefault: false } };
  await Promise.all([
    GmailAccountModel.updateMany(owned(ownerUserId), clear),
    MicrosoftMailAccountModel.updateMany(owned(ownerUserId), clear),
  ]);
  const mine = { _id: id, ...owned(ownerUserId) };
  const set = { $set: { isDefault: true } };
  if (provider === 'GMAIL') {
    await GmailAccountModel.updateOne(mine, set);
  } else {
    await MicrosoftMailAccountModel.updateOne(mine, set);
  }
  return myMailbox(ownerUserId, id);
}

/** Whether each provider's OAuth app is set up, so its Connect button can work. */
export async function myMailboxProviders() {
  const ready = (check: () => Promise<unknown>) =>
    check().then(
      () => true,
      () => false,
    );
  const [gmail, microsoft] = await Promise.all([ready(gmailClientConfig), ready(microsoftApp)]);
  return { gmail, microsoft };
}

/** A mailbox ready to send from: the caller's own row with its provider's OAuth client. */
export type SendingMailbox = { status: AccountRow['status'] } & (
  | { provider: 'GMAIL'; mailbox: AccountMailbox }
  | { provider: 'MICROSOFT'; mailbox: MicrosoftMailbox }
);

/** The caller's mailbox `id` with what a send needs; refused when it is not theirs. */
export async function sendingMailboxOf(ownerUserId: string, id: string): Promise<SendingMailbox> {
  if (!isValidObjectId(id)) {
    forbidden(NOT_YOURS);
  }
  const mine = { _id: id, ...owned(ownerUserId) };
  const [gmail, microsoft] = await Promise.all([
    GmailAccountModel.findOne(mine).lean<GmailAccountDocument | null>(),
    MicrosoftMailAccountModel.findOne(mine).lean<MicrosoftMailAccountDocument | null>(),
  ]);
  if (gmail) {
    const config = await gmailClientConfig();
    return { provider: 'GMAIL', status: gmail.status, mailbox: mailboxOf(config, gmail) };
  }
  if (microsoft) {
    const app = await microsoftApp();
    const mailbox = microsoftMailboxOf(app, microsoft);
    return { provider: 'MICROSOFT', status: microsoft.status, mailbox };
  }
  forbidden(NOT_YOURS);
}
