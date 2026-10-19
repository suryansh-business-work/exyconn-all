import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ConfigurationError } from '../../../../src/utils/errors';
import { enabledMailboxes } from '../../../../src/modules/gmail/gmail.accounts';
import { crmEmailSender, sendCrmEmail } from '../../../../src/modules/gmail/gmail.crm';
import {
  enabledMicrosoftMailboxes,
  isMicrosoftAccount,
  sendMicrosoftCrmEmail,
} from '../../../../src/modules/microsoft-mail';
import {
  crmEmailSenders,
  defaultEmailSender,
  emailReadiness,
  sendFromAnyMailbox,
} from '../../../../src/modules/crm-integrations/crm-integrations.email';
import { seedOrganization } from '../../../helpers';
import { asArg } from '../../../mockAs';

// The mail providers are external (Google, Microsoft); only their answers are faked here.
jest.mock('../../../../src/modules/gmail/gmail.accounts', () => ({ enabledMailboxes: jest.fn() }));
jest.mock('../../../../src/modules/gmail/gmail.crm', () => ({
  crmEmailSender: jest.fn(),
  sendCrmEmail: jest.fn(),
}));
jest.mock('../../../../src/modules/microsoft-mail', () => ({
  enabledMicrosoftMailboxes: jest.fn(),
  isMicrosoftAccount: jest.fn(),
  sendMicrosoftCrmEmail: jest.fn(),
}));

const gmailBoxes = jest.mocked(enabledMailboxes);
const microsoftBoxes = jest.mocked(enabledMicrosoftMailboxes);

/** Runs `fn` inside the operator company (or another one), as a request from it would. */
async function asCompany<T>(operator: boolean, fn: () => Promise<T>): Promise<T> {
  const company = await seedOrganization(operator ? 'Operator Co' : 'Customer Co');
  if (operator) {
    company.isPlatformOperator = true;
    await company.save();
  }
  return runForOrganization(company._id.toHexString(), fn);
}

const GMAIL = { id: 'g1', email: 'sales@exyconn.com' };
const OUTLOOK = { id: 'm1', email: 'team@exyconn.com' };

beforeEach(() => {
  gmailBoxes.mockResolvedValue([asArg(GMAIL)]);
  microsoftBoxes.mockResolvedValue([asArg(OUTLOOK)]);
});

afterEach(() => {
  invalidatePlatformOperatorCache();
});

describe('CRM email senders', () => {
  it('offers every connected Gmail and Microsoft mailbox in the operator CRM', async () => {
    await expect(asCompany(true, crmEmailSenders)).resolves.toEqual([
      { ...GMAIL, provider: 'GMAIL' },
      { ...OUTLOOK, provider: 'MICROSOFT' },
    ]);
  });

  it('offers none in any other company, or when no operator is flagged', async () => {
    await expect(crmEmailSenders()).resolves.toEqual([]);
    const operator = await seedOrganization('Operator Co');
    operator.isPlatformOperator = true;
    await operator.save();
    invalidatePlatformOperatorCache();
    await expect(asCompany(false, crmEmailSenders)).resolves.toEqual([]);
    expect(gmailBoxes).not.toHaveBeenCalled();
  });

  it('skips a provider whose sign-in app is not set up', async () => {
    gmailBoxes.mockRejectedValue(new ConfigurationError('Google OAuth is not configured'));

    await expect(asCompany(true, emailReadiness)).resolves.toEqual({
      gmail: false,
      microsoft: true,
    });
  });

  it('fails on any other provider error', async () => {
    microsoftBoxes.mockRejectedValue(new Error('Graph is down'));

    await expect(asCompany(true, crmEmailSenders)).rejects.toThrow('Graph is down');
  });

  it('reports both providers ready when each has a mailbox', async () => {
    await expect(asCompany(true, emailReadiness)).resolves.toEqual({
      gmail: true,
      microsoft: true,
    });
  });

  it('picks the default sender for a record from both providers', async () => {
    jest.mocked(crmEmailSender).mockResolvedValue(asArg('m1'));

    await expect(asCompany(true, () => defaultEmailSender('CONTACT', 'c1'))).resolves.toBe('m1');
    expect(crmEmailSender).toHaveBeenCalledWith('CONTACT', 'c1', ['g1', 'm1']);
  });
});

describe('sending from a mailbox', () => {
  const input = { fromAccountId: 'm1', to: ['asha@acme.com'], subject: 'Hi', body: 'Hello' };

  it('sends through Microsoft when the mailbox is a Microsoft one', async () => {
    jest.mocked(isMicrosoftAccount).mockResolvedValue(true);
    jest.mocked(sendMicrosoftCrmEmail).mockResolvedValue(asArg({ id: 'sent-1' }));

    await expect(sendFromAnyMailbox(input, 'Asha')).resolves.toEqual({
      provider: 'MICROSOFT',
      sent: { id: 'sent-1' },
    });
    expect(sendCrmEmail).not.toHaveBeenCalled();
  });

  it('sends through Gmail otherwise', async () => {
    jest.mocked(isMicrosoftAccount).mockResolvedValue(false);
    jest.mocked(sendCrmEmail).mockResolvedValue(asArg({ id: 'sent-2' }));

    await expect(sendFromAnyMailbox(input, 'Asha')).resolves.toEqual({
      provider: 'GMAIL',
      sent: { id: 'sent-2' },
    });
    expect(sendCrmEmail).toHaveBeenCalledWith(input, 'Asha');
  });
});
