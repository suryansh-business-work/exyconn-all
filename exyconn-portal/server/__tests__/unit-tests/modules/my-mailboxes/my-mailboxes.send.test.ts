import { Types } from 'mongoose';
import {
  CrmEmailMessageModel,
  GmailAccountModel,
} from '../../../../src/modules/gmail/gmail.models';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import {
  checkedEmail,
  MAX_RECIPIENTS,
  sendMyEmail,
  type SendMyEmailInput,
} from '../../../../src/modules/my-mailboxes/my-mailboxes.send';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { connectAccount, fakeGmail, saveClient } from '../gmail/fakeGmail';
import { connectMailbox, fakeMicrosoft, saveApp } from '../microsoft-mail/fakeMicrosoft';

const organizationId = useTestOrganization();
const ASHA = new Types.ObjectId().toHexString();
const BEN = new Types.ObjectId().toHexString();
const ASHA_GMAIL = 'asha@gmail.test';
const ASHA_OUTLOOK = 'asha@outlook.test';

const email = (extra: Partial<SendMyEmailInput> = {}): SendMyEmailInput => ({
  to: [' Ravi@Client.test '],
  cc: ['mo@client.test', 'ravi@client.test'],
  bcc: ['boss@acme.test'],
  subject: ' Hello ',
  body: '<p>Hi <strong>Ravi</strong></p><script>alert(1)</script>',
  ...extra,
});

const owned = (ownerUserId: string, fields: Record<string, unknown> = {}) => ({
  ownerUserId,
  ...fields,
});

beforeEach(async () => {
  await Promise.all([saveClient(), saveApp()]);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('checkedEmail', () => {
  it('cleans, de-duplicates and sanitizes before anything is sent', () => {
    const checked = checkedEmail(email({ replyTo: ' Me@Acme.test ' }));

    expect(checked).toEqual({
      to: ['ravi@client.test'],
      cc: ['mo@client.test'],
      bcc: ['boss@acme.test'],
      replyTo: 'me@acme.test',
      subject: 'Hello',
      body: '<p>Hi <strong>Ravi</strong></p>',
    });
  });

  it.each([
    ['no recipient', { to: [' '] }, 'Add at least one recipient.'],
    ['a bad address', { cc: ['nope'] }, 'nope is not a valid email address.'],
    ['a bad reply-to', { replyTo: 'nope' }, 'The reply-to address is not a valid email address.'],
    ['no subject', { subject: '  ' }, 'Write a subject.'],
    ['a long subject', { subject: 'a'.repeat(201) }, 'Keep the subject to 200 characters.'],
    ['an empty body', { body: '<p> </p><script>x</script>' }, 'Write a message.'],
    ['a huge body', { body: 'a'.repeat(200_001) }, 'The message is too long to send.'],
    [
      'too many recipients',
      { bcc: Array.from({ length: MAX_RECIPIENTS }, (_, n) => `p${n}@acme.test`) },
      `Send to at most ${MAX_RECIPIENTS} recipients at once.`,
    ],
  ])('refuses %s', (_name, extra, message) => {
    expect(() => checkedEmail(email(extra))).toThrow(message);
  });
});

describe('sendMyEmail', () => {
  it('sends HTML through Gmail from the default mailbox, with Bcc, and keeps no CRM record', async () => {
    await connectAccount(organizationId, ASHA_GMAIL, owned(ASHA));
    const gmail = fakeGmail({ [ASHA_GMAIL]: { threads: {} } });

    const sent = await sendMyEmail(ASHA, email({ replyTo: 'me@acme.test' }));

    expect(sent).toEqual({ from: ASHA_GMAIL, subject: 'Hello', recipientCount: 3 });
    const [{ raw, mailbox }] = gmail.sent;
    expect(mailbox).toBe(ASHA_GMAIL);
    expect(raw).toContain('Content-Type: text/html; charset="UTF-8"');
    expect(raw).toContain('Bcc: boss@acme.test');
    expect(raw).toContain('Reply-To: me@acme.test');
    const body = Buffer.from(raw.split('\r\n\r\n')[1], 'base64').toString('utf8');
    expect(body).toBe('<p>Hi <strong>Ravi</strong></p>');
    expect(await CrmEmailMessageModel.countDocuments()).toBe(0);
  });

  it('sends HTML through Microsoft from the chosen mailbox, with Bcc', async () => {
    await connectAccount(organizationId, ASHA_GMAIL, owned(ASHA, { isDefault: true }));
    const outlook = await connectMailbox(organizationId, ASHA_OUTLOOK, owned(ASHA));
    const microsoft = fakeMicrosoft({ [ASHA_OUTLOOK]: {} });

    await sendMyEmail(ASHA, email({ fromMailboxId: outlook }));

    expect(microsoft.sent).toEqual([
      {
        mailbox: ASHA_OUTLOOK,
        message: {
          subject: 'Hello',
          body: { contentType: 'HTML', content: '<p>Hi <strong>Ravi</strong></p>' },
          toRecipients: [{ emailAddress: { address: 'ravi@client.test' } }],
          ccRecipients: [{ emailAddress: { address: 'mo@client.test' } }],
          bccRecipients: [{ emailAddress: { address: 'boss@acme.test' } }],
        },
        saveToSentItems: true,
      },
    ]);
  });

  it("refuses another person's mailbox and a CRM mailbox, sending nothing", async () => {
    const bens = await connectAccount(organizationId, 'ben@gmail.test', owned(BEN));
    const crm = await connectAccount(organizationId, 'sales@acme.test');
    const gmail = fakeGmail({
      'ben@gmail.test': { threads: {} },
      'sales@acme.test': { threads: {} },
    });

    for (const id of [bens, crm]) {
      await expect(codeOf(sendMyEmail(ASHA, email({ fromMailboxId: id })))).resolves.toBe(
        'FORBIDDEN',
      );
    }
    expect(gmail.sent).toHaveLength(0);
  });

  it('asks to connect a mailbox first, or to reconnect one that stopped working', async () => {
    await expect(sendMyEmail(ASHA, email())).rejects.toThrow(
      'Connect your mailbox in Settings > Mailboxes first.',
    );
    const id = await connectAccount(
      organizationId,
      ASHA_GMAIL,
      owned(ASHA, { status: 'NEEDS_RECONNECT' }),
    );

    await expect(sendMyEmail(ASHA, email())).rejects.toThrow(
      'Reconnect your mailbox in Settings > Mailboxes first.',
    );
    await expect(sendMyEmail(ASHA, email({ fromMailboxId: id }))).rejects.toThrow(
      `Reconnect ${ASHA_GMAIL} in Settings > Mailboxes first.`,
    );
  });

  it('keeps a failed send on the mailbox and passes the error on', async () => {
    const gmailId = await connectAccount(organizationId, ASHA_GMAIL, owned(ASHA));
    const outlookId = await connectMailbox(organizationId, ASHA_OUTLOOK, owned(ASHA));
    fakeGmail({ [ASHA_GMAIL]: { threads: {}, revoked: true } });

    await expect(sendMyEmail(ASHA, email({ fromMailboxId: gmailId }))).rejects.toThrow(
      'Google refused the connection',
    );
    expect((await GmailAccountModel.findById(gmailId).lean())?.status).toBe('NEEDS_RECONNECT');

    jest.restoreAllMocks();
    fakeMicrosoft({ [ASHA_OUTLOOK]: { sendFails: 403 } });
    await expect(sendMyEmail(ASHA, email({ fromMailboxId: outlookId }))).rejects.toThrow(
      '/me/sendMail failed (403)',
    );
    const outlook = await MicrosoftMailAccountModel.findById(outlookId).lean();
    expect(outlook?.lastError).toContain('/me/sendMail failed (403)');
  });
});
