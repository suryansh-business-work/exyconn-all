import { runOnce } from '../../../../src/lib/migrations';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { seal } from '../../../../src/utils/secretBox';
import {
  disconnectGmailAccount,
  listGmailAccounts,
  migrateLegacyGmailConnection,
  presentGmailAccount,
  saveConnectedAccount,
  setGmailAccountEnabled,
} from '../../../../src/modules/gmail/gmail.accounts';
import {
  CrmEmailMessageModel,
  GmailAccountModel,
  GmailConfigModel,
} from '../../../../src/modules/gmail/gmail.models';
import { bodyTextOf, rawMessage } from '../../../../src/modules/gmail/gmail.mime';

const LEGACY = 'sales@exyconn.test';

const legacyConfig = () =>
  GmailConfigModel.create({
    key: 'default',
    clientId: 'client-id',
    connectedEmail: LEGACY,
    refreshToken: seal('refresh-legacy'),
    connectedAt: new Date('2026-09-01T00:00:00Z'),
    updatedByName: 'Ravi',
    enabled: true,
  });

const migrate = () =>
  runAsPlatform(() => runOnce('gmail-multi-account', migrateLegacyGmailConnection));

describe('the single-mailbox migration', () => {
  it('moves the old connection into an account and tags its synced mail, once', async () => {
    const config = await legacyConfig();
    await CrmEmailMessageModel.collection.insertOne({
      gmailId: 'old-1',
      threadId: 't1',
      direction: 'IN',
      sentAt: new Date(),
    });

    await expect(migrate()).resolves.toBe(true);
    await expect(migrate()).resolves.toBe(false);

    const accounts = await listGmailAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      email: LEGACY,
      refreshToken: config.refreshToken,
      enabled: true,
      status: 'CONNECTED',
      connectedByName: 'Ravi',
    });
    const message = await CrmEmailMessageModel.findOne({ gmailId: 'old-1' }).lean();
    expect(message).toMatchObject({ accountId: accounts[0]._id.toHexString(), mailbox: LEGACY });
    // The old fields stay, so a rollback still finds its connection.
    const kept = await GmailConfigModel.findOne({ key: 'default' }).lean();
    expect(kept?.refreshToken).toBe(config.refreshToken);
  });

  it('does nothing on an install that never connected a mailbox', async () => {
    await GmailConfigModel.create({ key: 'default', clientId: 'client-id' });

    await migrate();

    await expect(GmailAccountModel.countDocuments()).resolves.toBe(0);
  });
});

describe('connected accounts', () => {
  it('connecting the same Google account again renews its token on the same row', async () => {
    const first = await saveConnectedAccount(LEGACY, seal('one'), 'Ravi');
    await GmailAccountModel.updateOne(
      { _id: first._id },
      { status: 'NEEDS_RECONNECT', lastError: 'revoked', enabled: false },
    );

    const again = await saveConnectedAccount(LEGACY, seal('two'), 'Mira');

    expect(again._id.toHexString()).toBe(first._id.toHexString());
    expect(again).toMatchObject({ status: 'CONNECTED', lastError: '', connectedByName: 'Mira' });
    // Whether the CRM uses it stays the team's choice.
    expect(again.enabled).toBe(false);
    await expect(GmailAccountModel.countDocuments()).resolves.toBe(1);
  });

  it('turns an account off and disconnects it, never exposing its token', async () => {
    const account = await saveConnectedAccount(LEGACY, seal('one'), 'Ravi');
    const id = account._id.toHexString();

    const off = await setGmailAccountEnabled(id, false);
    expect(presentGmailAccount(off)).not.toHaveProperty('refreshToken');
    expect(off.enabled).toBe(false);

    await disconnectGmailAccount(id);
    await expect(GmailAccountModel.countDocuments()).resolves.toBe(0);
    await expect(disconnectGmailAccount(id)).rejects.toThrow();
  });
});

describe('gmail mime', () => {
  const base = { from: LEGACY, to: ['a@x.test'], cc: [], subject: 'Re: Hi', body: 'Yes' };
  const decoded = (raw: string) => Buffer.from(raw, 'base64url').toString('utf8');

  it('writes In-Reply-To and the References chain ending with it, without header injection', () => {
    const raw = decoded(
      rawMessage({ ...base, inReplyTo: '<c@x>', references: ['<a@x>', '<c@x>', '<b@x>'] }),
    );

    expect(raw).toContain('In-Reply-To: <c@x>\r\n');
    expect(raw).toContain('References: <a@x> <b@x> <c@x>\r\n');
    expect(decoded(rawMessage({ ...base, inReplyTo: '<c@x>\r\nBcc: evil@x' }))).not.toContain(
      '\r\nBcc:',
    );
  });

  it('reads HTML-only mail as text with its tags and scripts removed', () => {
    const html = Buffer.from('<div>Hi<br>there</div><script>x()</script>').toString('base64url');

    expect(bodyTextOf({ mimeType: 'text/html', body: { data: html } })).toBe('Hi\nthere');
  });
});
