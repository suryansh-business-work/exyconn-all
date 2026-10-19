import { Types } from 'mongoose';
import { open } from '../../../../src/utils/secretBox';
import {
  disconnectMicrosoftAccount,
  enabledMicrosoftMailboxes,
  isMicrosoftAccount,
  listMicrosoftAccounts,
  noteMicrosoftOutcome,
  presentMicrosoftAccount,
  saveMicrosoftAccount,
  setMicrosoftAccountEnabled,
} from '../../../../src/modules/microsoft-mail/microsoft.accounts';
import { MicrosoftAuthError } from '../../../../src/modules/microsoft-mail/microsoft.client';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import { codeOf } from '../codeOf';
import { APP_SECRET, connectMailbox, saveApp } from './fakeMicrosoft';

const SALES = 'sales@contoso.test';
const FOUNDER = 'founder@contoso.test';
const missingId = () => new Types.ObjectId().toHexString();
const stored = (id: string) => MicrosoftMailAccountModel.findById(id).lean();

describe('connected Microsoft mailboxes', () => {
  it('keeps one row per mailbox: connecting again renews its token and clears the error', async () => {
    const first = await saveMicrosoftAccount(SALES, 'rt-1', 'Ravi');
    await MicrosoftMailAccountModel.updateOne(
      { _id: first._id },
      { status: 'NEEDS_RECONNECT', lastError: 'revoked', enabled: false },
    );

    const again = await saveMicrosoftAccount(SALES, 'rt-2', 'Meera');

    expect(again._id.toHexString()).toBe(first._id.toHexString());
    expect(open(again.refreshToken)).toBe('rt-2');
    expect(again).toMatchObject({
      status: 'CONNECTED',
      lastError: '',
      connectedByName: 'Meera',
      // Turning a mailbox off for the CRM is a choice a reconnect does not undo.
      enabled: false,
    });
    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(1);
  });

  it('lists newest first and shows the CRM everything but the token', async () => {
    await connectMailbox(SALES, { connectedAt: new Date('2026-10-01T00:00:00Z') });
    const founderId = await connectMailbox(FOUNDER, {
      connectedAt: new Date('2026-10-02T00:00:00Z'),
      connectedByName: 'Ravi',
    });

    const shown = (await listMicrosoftAccounts()).map(presentMicrosoftAccount);

    expect(shown.map((account) => account.email)).toEqual([FOUNDER, SALES]);
    expect(shown[0]).toEqual({
      id: founderId,
      email: FOUNDER,
      enabled: true,
      status: 'CONNECTED',
      lastError: '',
      connectedAt: new Date('2026-10-02T00:00:00Z'),
      connectedByName: 'Ravi',
      lastUsedAt: null,
    });
  });

  it('turns a mailbox off and on, and says not found for one that is gone', async () => {
    const id = await connectMailbox(SALES);

    await expect(setMicrosoftAccountEnabled(id, false)).resolves.toMatchObject({ enabled: false });
    await expect(setMicrosoftAccountEnabled(id, true)).resolves.toMatchObject({ enabled: true });
    await expect(codeOf(setMicrosoftAccountEnabled(missingId(), true))).resolves.toBe('NOT_FOUND');
  });

  it('disconnects a mailbox once', async () => {
    const id = await connectMailbox(SALES);

    await expect(disconnectMicrosoftAccount(id)).resolves.toMatchObject({ email: SALES });
    await expect(codeOf(disconnectMicrosoftAccount(id))).resolves.toBe('NOT_FOUND');
  });

  it('knows a Microsoft sender id from anything else', async () => {
    const id = await connectMailbox(SALES);

    await expect(isMicrosoftAccount(id)).resolves.toBe(true);
    await expect(isMicrosoftAccount(missingId())).resolves.toBe(false);
    await expect(isMicrosoftAccount('gmail-account')).resolves.toBe(false);
  });
});

describe('noteMicrosoftOutcome', () => {
  it('marks a refused connection for a reconnect, with the reason', async () => {
    const id = await connectMailbox(SALES);

    await noteMicrosoftOutcome(id, { error: new MicrosoftAuthError('Connect it again.') });

    expect(await stored(id)).toMatchObject({ status: 'NEEDS_RECONNECT', lastError: 'Connect it again.' });
  });

  it('records other failures without asking for a reconnect', async () => {
    const id = await connectMailbox(SALES);

    await noteMicrosoftOutcome(id, { error: new Error('Graph is down') });
    expect(await stored(id)).toMatchObject({ status: 'CONNECTED', lastError: 'Graph is down' });

    await noteMicrosoftOutcome(id, { error: { code: 'ECONNRESET' } });
    expect(await stored(id)).toMatchObject({ lastError: 'No answer.' });
  });

  it('a call that worked clears the error and keeps a rotated refresh token', async () => {
    const id = await connectMailbox(SALES, { lastError: 'old failure' });
    const before = await stored(id);

    await noteMicrosoftOutcome(id, {});
    const kept = await stored(id);
    expect(kept).toMatchObject({ lastError: '', refreshToken: before?.refreshToken });
    expect(kept?.lastUsedAt).toBeInstanceOf(Date);

    await noteMicrosoftOutcome(id, { refreshToken: 'rt-rotated' });
    expect(open((await stored(id))?.refreshToken ?? '')).toBe('rt-rotated');
  });

  it('says not found for a mailbox that is gone', async () => {
    await expect(codeOf(noteMicrosoftOutcome(missingId(), {}))).resolves.toBe('NOT_FOUND');
  });
});

describe('enabledMicrosoftMailboxes', () => {
  it('is every mailbox turned on and still connected, with the app it connects through', async () => {
    await saveApp({ tenant: 'contoso.com' });
    const salesId = await connectMailbox(SALES);
    await connectMailbox(FOUNDER, { enabled: false });
    await connectMailbox('old@contoso.test', { status: 'NEEDS_RECONNECT' });

    const mailboxes = await enabledMicrosoftMailboxes();

    expect(mailboxes).toEqual([
      {
        id: salesId,
        email: SALES,
        refreshToken: expect.any(String),
        clientId: 'ms-client-id',
        clientSecret: APP_SECRET,
        tenant: 'contoso.com',
      },
    ]);
    expect(open(mailboxes[0].refreshToken)).toBe(`refresh-${SALES}`);
  });

  it('refuses while the app is not set up', async () => {
    await connectMailbox(SALES);

    await expect(enabledMicrosoftMailboxes()).rejects.toThrow('Microsoft mail is not set up.');
  });
});
