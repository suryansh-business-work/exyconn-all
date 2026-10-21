import { clientEmailService } from '../../../../../src/modules/clienthub/records/client-email.service';
import { ClientCommunicationModel } from '../../../../../src/modules/clienthub/records/client-communication.model';
import { ClientContactModel } from '../../../../../src/modules/clienthub/contact.model';
import { emailer } from '../../../../../src/modules/email/email.service';
import { useTestOrganization } from '../../../../helpers';
import { codeOf } from '../../codeOf';
import { seedClient } from './fixtures';

useTestOrganization();
let acme: string;
let send: jest.SpyInstance;
const MESSAGE = { subject: 'Next steps', message: 'Line one\nLine <two>' };

beforeEach(async () => {
  send = jest.spyOn(emailer, 'send').mockResolvedValue(undefined);
  acme = await seedClient('Acme', 'dana@acme.test');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('emailing a client', () => {
  it('offers the client’s own address and each active hub contact, once each', async () => {
    await ClientContactModel.create({ clientId: acme, name: 'Billing', email: 'other@acme.test' });

    const { recipients } = await clientEmailService.recipients(acme);

    expect(recipients.map((r) => r.email)).toEqual([
      'billing@acme.test',
      'dana@acme.test',
      'other@acme.test',
    ]);
  });

  it('sends to the picked addresses and files the email in the log', async () => {
    const sent = await clientEmailService.send(
      acme,
      { ...MESSAGE, to: ['DANA@acme.test'] },
      'Arjun',
    );

    expect(sent).toBe(1);
    const variables = send.mock.calls[0][0].variables;
    expect(variables.message.html).toBe('Line one<br />Line &lt;two&gt;');
    const logged = await ClientCommunicationModel.findOne({ clientId: acme }).lean();
    expect(logged).toMatchObject({
      type: 'EMAIL',
      subject: 'Next steps',
      participants: 'dana@acme.test',
      loggedByName: 'Arjun',
    });
    expect(logged?.notifiedAt).toBeInstanceOf(Date);
  });

  it('refuses an address the client does not have on file', async () => {
    const call = clientEmailService.send(
      acme,
      { ...MESSAGE, to: ['dana@acme.test', 'stranger@evil.test'] },
      'Arjun',
    );

    expect(await codeOf(call)).toBe('BAD_USER_INPUT');
    expect(send).not.toHaveBeenCalled();
  });

  it('logs nothing when every delivery fails', async () => {
    send.mockRejectedValue(new Error('SMTP down'));

    const call = clientEmailService.send(acme, { ...MESSAGE, to: ['dana@acme.test'] }, 'Arjun');

    expect(await codeOf(call)).toBe('BAD_USER_INPUT');
    expect(await ClientCommunicationModel.countDocuments()).toBe(0);
  });

  it('refuses an empty subject or message', async () => {
    const call = clientEmailService.send(
      acme,
      { to: ['dana@acme.test'], subject: '', message: 'x' },
      'A',
    );

    expect(await codeOf(call)).toBe('BAD_USER_INPUT');
  });
});
