import { contactsService } from '../../../../src/modules/clienthub/contacts.service';
import { ClientContactModel } from '../../../../src/modules/clienthub/contact.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { emailer } from '../../../../src/modules/email/email.service';
import { logger } from '../../../../src/utils/logger';
import { env } from '../../../../src/config/env';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

let send: jest.SpyInstance;

beforeEach(() => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const seedClient = (company = 'Acme Ltd') =>
  ClientModel.create({ name: 'Dana', email: 'dana@acme.test', company });

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('contactsService.add', () => {
  it('gives access, stores a clean address and emails where to sign in', async () => {
    const client = await seedClient();

    const contact = await contactsService.add({
      clientId: String(client._id),
      name: '  Dana Reyes ',
      email: ' Dana@Acme.TEST ',
    });

    expect(contact).toMatchObject({ name: 'Dana Reyes', email: 'dana@acme.test', active: true });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'client-hub-invite',
        to: 'dana@acme.test',
        variables: { name: 'Dana Reyes', clientName: 'Acme Ltd', hubUrl: env.clientHubUrl },
      }),
    );
  });

  it('names the client by its contact name when it has no company name', async () => {
    const client = await seedClient();
    await ClientModel.collection.updateOne({ _id: client._id }, { $set: { company: '' } });

    await contactsService.add({ clientId: String(client._id), name: 'Dana', email: 'd@acme.test' });

    expect(send.mock.calls[0][0].variables.clientName).toBe('Dana');
  });

  it('keeps the access when the invite email fails, and logs it', async () => {
    const client = await seedClient();
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    send.mockRejectedValueOnce(new Error('SMTP down'));

    await contactsService.add({ clientId: String(client._id), name: 'Dana', email: 'd@acme.test' });
    await flush();

    expect(await ClientContactModel.countDocuments({ email: 'd@acme.test' })).toBe(1);
    expect(logged).toHaveBeenCalledWith(expect.anything(), 'Client hub invite email failed');
  });

  it.each([
    ['an empty name', '   ', 'd@acme.test', /name/],
    ['a name over 120 characters', 'n'.repeat(121), 'd@acme.test', /name/],
    ['an invalid address', 'Dana', 'not-an-email', /valid email/],
  ])('refuses %s', async (_label, name, email, message) => {
    const client = await seedClient();

    await expect(
      contactsService.add({ clientId: String(client._id), name, email }),
    ).rejects.toThrow(message);
    expect(await ClientContactModel.countDocuments()).toBe(0);
  });

  it('refuses a client that does not exist', async () => {
    const attempt = contactsService.add({
      clientId: '64b000000000000000000099',
      name: 'Dana',
      email: 'd@acme.test',
    });

    await expect(attempt).rejects.toThrow(/Client not found/);
  });

  it('refuses an address that already has access', async () => {
    const client = await seedClient();
    const input = { clientId: String(client._id), name: 'Dana', email: 'd@acme.test' };
    await contactsService.add(input);

    await expect(contactsService.add(input)).rejects.toThrow(/already has client hub access/);
  });
});

describe('contactsService.list', () => {
  it('lists one client’s contacts, oldest first', async () => {
    const client = await seedClient();
    const clientId = String(client._id);
    await ClientContactModel.create({ clientId, name: 'First', email: 'a@acme.test' });
    await ClientContactModel.create({ clientId, name: 'Second', email: 'b@acme.test' });
    await ClientContactModel.create({ clientId: 'other', name: 'Else', email: 'c@x.test' });

    const rows = await contactsService.list(clientId);

    expect(rows.map((row) => row.name)).toEqual(['First', 'Second']);
  });
});

describe('contactsService.setActive', () => {
  it('switching off retires every pass by raising the token version', async () => {
    const contact = await ClientContactModel.create({
      clientId: 'c',
      name: 'D',
      email: 'd@x.test',
    });

    const off = await contactsService.setActive(String(contact._id), false);

    expect(off).toMatchObject({ active: false, tokenVersion: 1 });
  });

  it('switching back on keeps the token version', async () => {
    const contact = await ClientContactModel.create({
      clientId: 'c',
      name: 'D',
      email: 'd@x.test',
      active: false,
      tokenVersion: 1,
    });

    const on = await contactsService.setActive(String(contact._id), true);

    expect(on).toMatchObject({ active: true, tokenVersion: 1 });
  });

  it('refuses a contact that does not exist', async () => {
    await expect(contactsService.setActive('64b000000000000000000099', true)).rejects.toThrow(
      /Client contact not found/,
    );
  });
});

describe('contactsService.remove', () => {
  it('deletes the contact', async () => {
    const contact = await ClientContactModel.create({
      clientId: 'c',
      name: 'D',
      email: 'd@x.test',
    });

    expect(await contactsService.remove(String(contact._id))).toBe(true);
    expect(await ClientContactModel.countDocuments()).toBe(0);
  });

  it('refuses a contact that does not exist', async () => {
    await expect(contactsService.remove('64b000000000000000000099')).rejects.toThrow(
      /Client contact not found/,
    );
  });
});
