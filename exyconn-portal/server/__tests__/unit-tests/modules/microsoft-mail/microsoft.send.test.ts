import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, runForOrganization } from '../../../../src/lib/tenant';
import { CrmEmailMessageModel } from '../../../../src/modules/gmail/gmail.models';
import { MicrosoftAuthError } from '../../../../src/modules/microsoft-mail/microsoft.client';
import { MicrosoftMailAccountModel } from '../../../../src/modules/microsoft-mail/microsoft.models';
import { sendMicrosoftCrmEmail } from '../../../../src/modules/microsoft-mail/microsoft.send';
import { OrganizationModel } from '../../../../src/modules/organizations/organization.model';
import { open } from '../../../../src/utils/secretBox';
import { codeOf } from '../codeOf';
import { connectMailbox, fakeMicrosoft, saveApp } from './fakeMicrosoft';

const SALES = 'sales@contoso.test';
const ASHA = 'asha@acme.test';
const BEN = 'ben@acme.test';

let operatorId = '';
const asOperator = <T>(work: () => Promise<T>) => runForOrganization(operatorId, work);
const email = (fromAccountId: string, extra: Record<string, unknown> = {}) => ({
  fromAccountId,
  to: [ASHA],
  subject: ' Pricing ',
  body: 'Here it is.',
  ...extra,
});

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  const operator = await runAsPlatform(() =>
    OrganizationModel.create({
      name: 'Exyconn',
      slug: 'exyconn',
      currency: 'USD',
      isPlatformOperator: true,
    }),
  );
  operatorId = operator._id.toHexString();
  await saveApp();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('sendMicrosoftCrmEmail', () => {
  it('sends through Graph from the chosen mailbox and keeps the message on the record', async () => {
    const salesId = await connectMailbox(SALES);
    const microsoft = fakeMicrosoft({ [SALES]: { rotateTo: 'rt-rotated' } });

    const sent = await asOperator(() =>
      sendMicrosoftCrmEmail(email(salesId, { cc: [BEN, ASHA] }), 'Ravi'),
    );

    expect(microsoft.sent).toEqual([
      {
        mailbox: SALES,
        message: {
          subject: 'Pricing',
          body: { contentType: 'Text', content: 'Here it is.' },
          toRecipients: [{ emailAddress: { address: ASHA } }],
          ccRecipients: [
            { emailAddress: { address: BEN } },
            { emailAddress: { address: ASHA } },
          ],
        },
        saveToSentItems: true,
      },
    ]);
    expect(sent).toMatchObject({
      id: sent.gmailId,
      threadId: sent.gmailId,
      accountId: salesId,
      direction: 'OUT',
      from: SALES,
      participants: [SALES, ASHA, BEN],
      sentByName: 'Ravi',
    });
    expect(sent.gmailId).toMatch(/^microsoft:[\da-f-]{36}$/);
    const stored = await asOperator(() =>
      CrmEmailMessageModel.findOne({ gmailId: sent.gmailId }).lean(),
    );
    expect(stored).toMatchObject({ mailbox: SALES, subject: 'Pricing', sentByName: 'Ravi' });
    const account = await runAsPlatform(() => MicrosoftMailAccountModel.findById(salesId).lean());
    expect(open(account?.refreshToken ?? '')).toBe('rt-rotated');
    expect(account?.lastUsedAt).toBeInstanceOf(Date);
  });

  it('keeps a short snippet and caps the stored body', async () => {
    const salesId = await connectMailbox(SALES);
    fakeMicrosoft({ [SALES]: {} });
    const body = 'a'.repeat(60_000);

    const sent = await asOperator(() => sendMicrosoftCrmEmail(email(salesId, { body }), 'Ravi'));

    expect(sent.snippet).toHaveLength(200);
    expect(sent.bodyText).toHaveLength(50_000);
  });

  it('refuses a mailbox turned off for the CRM, and an unknown one', async () => {
    const offId = await connectMailbox(SALES, { enabled: false });
    const microsoft = fakeMicrosoft({ [SALES]: {} });

    await expect(codeOf(asOperator(() => sendMicrosoftCrmEmail(email(offId), 'Ravi')))).resolves.toBe(
      'BAD_USER_INPUT',
    );
    await expect(
      codeOf(asOperator(() => sendMicrosoftCrmEmail(email('64b000000000000000000000'), 'Ravi'))),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(microsoft.sent).toHaveLength(0);
  });

  it('refuses invalid recipients before touching Microsoft', async () => {
    const salesId = await connectMailbox(SALES);
    const microsoft = fakeMicrosoft({ [SALES]: {} });

    await expect(
      codeOf(asOperator(() => sendMicrosoftCrmEmail(email(salesId, { to: ['nope'] }), 'Ravi'))),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(microsoft.tokens).toHaveLength(0);
  });

  it('refuses a customer company, whose CRM never reaches the operator mail', async () => {
    const salesId = await connectMailbox(SALES);
    const customer = await runAsPlatform(() =>
      OrganizationModel.create({ name: 'Customer', slug: 'customer', currency: 'USD' }),
    );

    await expect(
      codeOf(
        runForOrganization(customer._id.toHexString(), () =>
          sendMicrosoftCrmEmail(email(salesId), 'Ravi'),
        ),
      ),
    ).resolves.toBe('FORBIDDEN');
  });

  it('records a refused send on the mailbox, keeps nothing and passes the error on', async () => {
    const salesId = await connectMailbox(SALES);
    fakeMicrosoft({ [SALES]: { sendFails: 401 } });

    await expect(
      asOperator(() => sendMicrosoftCrmEmail(email(salesId), 'Ravi')),
    ).rejects.toBeInstanceOf(MicrosoftAuthError);

    const account = await runAsPlatform(() => MicrosoftMailAccountModel.findById(salesId).lean());
    expect(account?.status).toBe('NEEDS_RECONNECT');
    expect(account?.lastError).toContain('/me/sendMail failed (401)');
    expect(await asOperator(() => CrmEmailMessageModel.countDocuments())).toBe(0);
  });
});
