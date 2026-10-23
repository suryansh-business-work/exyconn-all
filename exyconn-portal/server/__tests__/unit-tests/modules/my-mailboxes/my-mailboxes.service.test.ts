import { Types } from 'mongoose';
import { enabledMailboxes, listGmailAccounts } from '../../../../src/modules/gmail/gmail.accounts';
import { GmailAccountModel } from '../../../../src/modules/gmail/gmail.models';
import { mailMailboxes } from '../../../../src/modules/crm-mail/crm-mail.mailboxes';
import {
  enabledMicrosoftMailboxes,
  isMicrosoftAccount,
  listMicrosoftAccounts,
} from '../../../../src/modules/microsoft-mail/microsoft.accounts';
import {
  MicrosoftMailAccountModel,
  MicrosoftMailConfigModel,
} from '../../../../src/modules/microsoft-mail/microsoft.models';
import { runAsPlatform } from '../../../../src/lib/tenant';
import {
  disconnectMyMailbox,
  listMyMailboxes,
  myMailboxProviders,
  setDefaultMyMailbox,
  testMyMailbox,
} from '../../../../src/modules/my-mailboxes/my-mailboxes.service';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { connectAccount, fakeGmail, saveClient } from '../gmail/fakeGmail';
import { connectMailbox, fakeMicrosoft, saveApp } from '../microsoft-mail/fakeMicrosoft';

const organizationId = useTestOrganization();
const ASHA = new Types.ObjectId().toHexString();
const BEN = new Types.ObjectId().toHexString();
const ASHA_GMAIL = 'asha@gmail.test';
const ASHA_OUTLOOK = 'asha@outlook.test';
const SALES = 'sales@acme.test';

const mine = (ownerUserId: string, at: string, fields: Record<string, unknown> = {}) => ({
  ownerUserId,
  connectedAt: new Date(at),
  ...fields,
});

beforeEach(async () => {
  await Promise.all([saveClient(), saveApp()]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('listMyMailboxes', () => {
  it("lists only the caller's mailboxes across providers, newest first, the newest as default", async () => {
    const older = await connectAccount(organizationId, ASHA_GMAIL, mine(ASHA, '2026-10-01'));
    const newer = await connectMailbox(organizationId, ASHA_OUTLOOK, mine(ASHA, '2026-10-02'));
    await connectAccount(organizationId, SALES);
    await connectAccount(organizationId, 'ben@gmail.test', mine(BEN, '2026-10-03'));

    const listed = await listMyMailboxes(ASHA);

    expect(listed.map(({ id, provider, isDefault }) => ({ id, provider, isDefault }))).toEqual([
      { id: newer, provider: 'MICROSOFT', isDefault: true },
      { id: older, provider: 'GMAIL', isDefault: false },
    ]);
    expect(JSON.stringify(listed)).not.toContain('refresh-');
  });

  it('puts the chosen default first, and reads rows saved without the newer fields', async () => {
    const chosen = await connectAccount(
      organizationId,
      ASHA_GMAIL,
      mine(ASHA, '2026-10-01', { isDefault: true }),
    );
    await connectMailbox(organizationId, ASHA_OUTLOOK, mine(ASHA, '2026-10-02'));
    await GmailAccountModel.collection.updateOne(
      { _id: new Types.ObjectId(chosen) },
      { $unset: { lastErrorAt: '' } },
    );

    const [first] = await listMyMailboxes(ASHA);

    expect(first).toMatchObject({ id: chosen, isDefault: true, lastErrorAt: null });
  });
});

describe('the CRM never sees a personal mailbox', () => {
  it('keeps personal rows out of every CRM list and sender, even at the same address', async () => {
    const crm = await connectAccount(organizationId, SALES);
    const personal = await connectAccount(organizationId, SALES, mine(ASHA, '2026-10-01'));
    const crmOutlook = await connectMailbox(organizationId, 'ops@acme.test');
    const personalOutlook = await connectMailbox(
      organizationId,
      ASHA_OUTLOOK,
      mine(ASHA, '2026-10-01'),
    );

    expect((await listGmailAccounts()).map((row) => row._id.toHexString())).toEqual([crm]);
    expect((await enabledMailboxes()).map((mailbox) => mailbox.id)).toEqual([crm]);
    expect((await listMicrosoftAccounts()).map((row) => row._id.toHexString())).toEqual([
      crmOutlook,
    ]);
    expect((await enabledMicrosoftMailboxes()).map((mailbox) => mailbox.id)).toEqual([crmOutlook]);
    expect((await mailMailboxes()).map((mailbox) => mailbox.id)).toEqual([crm, crmOutlook]);
    await expect(isMicrosoftAccount(personalOutlook)).resolves.toBe(false);
    expect(personal).not.toBe(crm);
  });

  it('still refuses a second CRM row or a second personal row for one address', async () => {
    await GmailAccountModel.createIndexes();
    await connectAccount(organizationId, SALES);
    await connectAccount(organizationId, SALES, mine(ASHA, '2026-10-01'));

    await expect(connectAccount(organizationId, SALES)).rejects.toThrow('E11000');
    await expect(connectAccount(organizationId, SALES, mine(ASHA, '2026-10-02'))).rejects.toThrow(
      'E11000',
    );
  });
});

describe('ownership', () => {
  it("refuses another person's mailbox, a CRM mailbox and a malformed id", async () => {
    const bens = await connectAccount(organizationId, 'ben@gmail.test', mine(BEN, '2026-10-01'));
    const crm = await connectMailbox(organizationId, SALES);

    for (const id of [bens, crm, 'not-an-id']) {
      await expect(codeOf(testMyMailbox(ASHA, id))).resolves.toBe('FORBIDDEN');
      await expect(codeOf(disconnectMyMailbox(ASHA, id))).resolves.toBe('FORBIDDEN');
      await expect(codeOf(setDefaultMyMailbox(ASHA, id))).resolves.toBe('FORBIDDEN');
    }
    expect(await GmailAccountModel.countDocuments()).toBe(1);
    expect(await MicrosoftMailAccountModel.countDocuments()).toBe(1);
  });
});

describe('test, default and disconnect', () => {
  it('tests a Gmail mailbox with the provider and keeps a failure on it', async () => {
    const id = await connectAccount(organizationId, ASHA_GMAIL, mine(ASHA, '2026-10-01'));
    fakeGmail({ [ASHA_GMAIL]: { threads: {}, revoked: true } });

    const tested = await testMyMailbox(ASHA, id);

    expect(tested).toMatchObject({ id, status: 'NEEDS_RECONNECT', isDefault: true });
    expect(tested.lastError).toContain('Google refused the connection');
  });

  it('tests a Microsoft mailbox and clears its last error when it works', async () => {
    const id = await connectMailbox(
      organizationId,
      ASHA_OUTLOOK,
      mine(ASHA, '2026-10-01', { lastError: 'old', status: 'NEEDS_RECONNECT' }),
    );
    fakeMicrosoft({ [ASHA_OUTLOOK]: {} });

    await expect(testMyMailbox(ASHA, id)).resolves.toMatchObject({
      status: 'CONNECTED',
      lastError: '',
    });
  });

  it('moves the default to the chosen mailbox across providers', async () => {
    const gmail = await connectAccount(
      organizationId,
      ASHA_GMAIL,
      mine(ASHA, '2026-10-01', { isDefault: true }),
    );
    const outlook = await connectMailbox(organizationId, ASHA_OUTLOOK, mine(ASHA, '2026-10-02'));

    await expect(setDefaultMyMailbox(ASHA, outlook)).resolves.toMatchObject({ isDefault: true });

    expect((await GmailAccountModel.findById(gmail).lean())?.isDefault).toBe(false);
    expect((await listMyMailboxes(ASHA))[0].id).toBe(outlook);
  });

  it('disconnects the mailbox and names its address', async () => {
    const id = await connectMailbox(organizationId, ASHA_OUTLOOK, mine(ASHA, '2026-10-01'));

    await expect(disconnectMyMailbox(ASHA, id)).resolves.toBe(ASHA_OUTLOOK);
    await expect(listMyMailboxes(ASHA)).resolves.toEqual([]);
  });
});

describe('myMailboxProviders', () => {
  it('says which OAuth apps are set up', async () => {
    await expect(myMailboxProviders()).resolves.toEqual({ gmail: true, microsoft: true });
    await runAsPlatform(() => MicrosoftMailConfigModel.deleteMany({}));

    await expect(myMailboxProviders()).resolves.toEqual({ gmail: true, microsoft: false });
  });
});
