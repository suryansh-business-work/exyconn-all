import {
  contactForPass,
  requestClientHubCode,
  verifyClientHubCode,
} from '../../../../src/modules/clienthub/clienthub.auth';
import { ClientContactModel } from '../../../../src/modules/clienthub/contact.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { signPass } from '../../../../src/lib/scopedPass';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { useTestOrganization } from '../../../helpers';

const organizationId = useTestOrganization();
const IP = 'test-connection';
const EMAIL = 'dana@acme.test';

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function seedContact(overrides: Record<string, unknown> = {}) {
  const client = await ClientModel.create({ name: 'Dana', email: EMAIL, company: 'Acme' });
  return ClientContactModel.create({
    clientId: String(client._id),
    name: 'Dana Reyes',
    email: EMAIL,
    ...overrides,
  });
}

const sentCode = (): string => send.mock.calls.at(-1)[0].variables.code;

describe('requestClientHubCode', () => {
  it('emails a six-digit code to a contact with access, whatever the address case', async () => {
    await seedContact();

    expect(await requestClientHubCode('  Dana@Acme.TEST ', IP)).toBe(true);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'client-hub-code',
        to: EMAIL,
        variables: expect.objectContaining({ name: 'Dana Reyes', expiresIn: '10 minutes' }),
      }),
    );
    expect(sentCode()).toMatch(/^\d{6}$/);
  });

  it('refuses something that is not an email address', async () => {
    await expect(requestClientHubCode('not-an-address', IP)).rejects.toThrow(/valid email/);
    expect(send).not.toHaveBeenCalled();
  });

  it('tells an address without access so, and sends nothing', async () => {
    await expect(requestClientHubCode('nobody@acme.test', IP)).rejects.toThrow(
      /does not have client hub access/,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('treats a switched-off contact as having no access', async () => {
    await seedContact({ active: false });

    await expect(requestClientHubCode(EMAIL, IP)).rejects.toThrow(/does not have/);
  });

  it('treats a contact that belongs to no company as having no access', async () => {
    await runAsPlatform(() =>
      ClientContactModel.create({ clientId: 'c1', name: 'Orphan', email: EMAIL }),
    );

    await expect(requestClientHubCode(EMAIL, IP)).rejects.toThrow(/does not have/);
  });

  it('asks the person to retry when the email cannot be sent', async () => {
    await seedContact();
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await expect(requestClientHubCode(EMAIL, IP)).rejects.toThrow(/could not send the code/);
  });
});

describe('verifyClientHubCode', () => {
  it('signs the contact in with the emailed code and counts the sign-in', async () => {
    const contact = await seedContact();
    await requestClientHubCode(EMAIL, IP);

    const session = await verifyClientHubCode(EMAIL.toUpperCase(), sentCode());

    expect(session).toMatchObject({ name: 'Dana Reyes', email: EMAIL });
    const stored = await ClientContactModel.findById(contact._id).lean();
    expect(stored?.signInCount).toBe(1);
    expect(stored?.lastSignInAt).toBeInstanceOf(Date);
    expect(await contactForPass(session.token)).toMatchObject({
      id: String(contact._id),
      email: EMAIL,
      organizationId,
    });
  });

  it('refuses a wrong code', async () => {
    await seedContact();
    await requestClientHubCode(EMAIL, IP);
    const wrong = sentCode() === '000000' ? '111111' : '000000';

    await expect(verifyClientHubCode(EMAIL, wrong)).rejects.toThrow(/not right/);
  });

  it('refuses an address with no access as an expired code', async () => {
    await expect(verifyClientHubCode('ghost@acme.test', '123456')).rejects.toThrow(/expired/);
  });

  it('refuses when access is switched off while the code is being checked', async () => {
    await seedContact();
    await requestClientHubCode(EMAIL, IP);
    jest
      .spyOn(ClientContactModel, 'findOneAndUpdate')
      .mockReturnValueOnce({ lean: () => Promise.resolve(null) } as never);

    await expect(verifyClientHubCode(EMAIL, sentCode())).rejects.toThrow(/switched off/);
  });
});

describe('contactForPass', () => {
  const passFor = (id: unknown, tv = 0) => signPass('client-hub', { sub: String(id), tv }, '1h');

  it('returns the contact a live pass names', async () => {
    const contact = await seedContact();

    expect(await contactForPass(passFor(contact._id))).toEqual({
      id: String(contact._id),
      clientId: contact.clientId,
      name: 'Dana Reyes',
      email: EMAIL,
      organizationId,
    });
  });

  it('refuses a forged pass', async () => {
    expect(await contactForPass('not.a.pass')).toBeNull();
  });

  it('refuses a pass whose contact was deleted', async () => {
    const contact = await seedContact();
    await ClientContactModel.deleteOne({ _id: contact._id });

    expect(await contactForPass(passFor(contact._id))).toBeNull();
  });

  it('refuses a pass for a contact that belongs to no company', async () => {
    const orphan = await runAsPlatform(() =>
      ClientContactModel.create({ clientId: 'c1', name: 'Orphan', email: EMAIL }),
    );

    expect(await contactForPass(passFor(orphan._id))).toBeNull();
  });

  it('refuses a pass once the contact is switched off', async () => {
    const contact = await seedContact({ active: false });

    expect(await contactForPass(passFor(contact._id))).toBeNull();
  });

  it('refuses a pass issued before the token version was raised', async () => {
    const contact = await seedContact({ tokenVersion: 2 });

    expect(await contactForPass(passFor(contact._id, 1))).toBeNull();
  });

  it('refuses a pass whose client no longer exists', async () => {
    const contact = await seedContact();
    await ClientModel.deleteOne({ _id: contact.clientId });

    expect(await contactForPass(passFor(contact._id))).toBeNull();
  });
});
