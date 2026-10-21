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

/** Runs `fn` inside a company, as a request from it would. */
async function inCompany<T>(fn: () => Promise<T>): Promise<T> {
  const company = await seedOrganization('Customer Co');
  return runForOrganization(company._id.toHexString(), fn);
}

const GMAIL = { id: 'g1', email: 'sales@exyconn.com' };
const OUTLOOK = { id: 'm1', email: 'team@exyconn.com' };

beforeEach(() => {
  gmailBoxes.mockResolvedValue([asArg(GMAIL)]);
  microsoftBoxes.mockResolvedValue([asArg(OUTLOOK)]);
});

describe('CRM email senders', () => {
  it('offers every connected Gmail and Microsoft mailbox of the company, whichever it is', async () => {
    await expect(inCompany(crmEmailSenders)).resolves.toEqual([
      { ...GMAIL, provider: 'GMAIL' },
      { ...OUTLOOK, provider: 'MICROSOFT' },
    ]);
  });

  it('offers none to a caller acting in no company, without asking either provider', async () => {
    // The suites run as the platform by default: no company is in scope.
    await expect(crmEmailSenders()).resolves.toHaveLength(0);
    await expect(emailReadiness()).resolves.toEqual({ gmail: false, microsoft: false });
    expect(gmailBoxes).not.toHaveBeenCalled();
    expect(microsoftBoxes).not.toHaveBeenCalled();
  });

  it('skips a provider whose sign-in app is not set up', async () => {
    gmailBoxes.mockRejectedValue(new ConfigurationError('Google OAuth is not configured'));

    await expect(inCompany(emailReadiness)).resolves.toEqual({
      gmail: false,
      microsoft: true,
    });
  });

  it('fails on any other provider error', async () => {
    microsoftBoxes.mockRejectedValue(new Error('Graph is down'));

    await expect(inCompany(crmEmailSenders)).rejects.toThrow('Graph is down');
  });

  it('reports both providers ready when each has a mailbox', async () => {
    await expect(inCompany(emailReadiness)).resolves.toEqual({
      gmail: true,
      microsoft: true,
    });
  });

  it('picks the default sender for a record from both providers', async () => {
    jest.mocked(crmEmailSender).mockResolvedValue(asArg('m1'));

    await expect(inCompany(() => defaultEmailSender('CONTACT', 'c1'))).resolves.toBe('m1');
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
