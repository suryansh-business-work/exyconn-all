import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import {
  assertValid,
  createClientSupportTicket,
  fileClientTicket,
  normalize,
  resetClientTicketLimits,
} from '../../../../src/modules/support/client-ticket.service';

const input = (overrides: Record<string, string> = {}) => ({
  requesterName: 'Dana Reyes',
  requesterEmail: 'dana@acme.test',
  subject: 'Portal will not load',
  category: 'OTHER',
  description: 'Every page hangs on the spinner since this morning, on two machines.',
  priority: 'HIGH',
  ...overrides,
});

beforeEach(async () => {
  await resetClientTicketLimits();
});

describe('normalize', () => {
  it('trims the free text and lower-cases the address, leaving the enums alone', () => {
    expect(
      normalize(
        input({
          requesterName: '  Dana  ',
          requesterEmail: ' Dana@ACME.test ',
          subject: ' Help ',
          description: ' Long text ',
        }),
      ),
    ).toEqual({
      requesterName: 'Dana',
      requesterEmail: 'dana@acme.test',
      subject: 'Help',
      category: 'OTHER',
      description: 'Long text',
      priority: 'HIGH',
    });
  });
});

describe('assertValid', () => {
  it('accepts every field at its limits', () => {
    expect(() =>
      assertValid(
        input({ requesterName: 'Al', subject: 'x'.repeat(120), description: 'y'.repeat(4000) }),
      ),
    ).not.toThrow();
  });

  it('refuses a name or subject that is too short or too long', () => {
    expect(() => assertValid(input({ requesterName: 'A' }))).toThrow(
      'Name must be at least 2 characters',
    );
    expect(() => assertValid(input({ requesterName: 'n'.repeat(81) }))).toThrow(
      'Name must be at most 80 characters',
    );
    expect(() => assertValid(input({ subject: 'Help' }))).toThrow(
      'Subject must be at least 5 characters',
    );
    expect(() => assertValid(input({ subject: 's'.repeat(121) }))).toThrow(
      'Subject must be at most 120 characters',
    );
    expect(() => assertValid(input({ description: 'd'.repeat(4001) }))).toThrow(
      'Description must be at most 4000 characters',
    );
  });

  it('refuses an address longer than any mailbox can be, even when it is well formed', () => {
    const long = `${'a'.repeat(250)}@acme.test`;

    expect(() => assertValid(input({ requesterEmail: long }))).toThrow(
      'Enter a valid email address',
    );
  });
});

describe('createClientSupportTicket', () => {
  it('stops one connection filing more than twenty tickets an hour across addresses', async () => {
    for (let mailbox = 0; mailbox < 4; mailbox += 1) {
      for (let i = 0; i < 5; i += 1) {
        await createClientSupportTicket(
          input({ requesterEmail: `user${mailbox}@acme.test`, subject: `Portal down ${i}` }),
          'PORTAL',
          'one-connection',
        );
      }
    }

    await expect(
      createClientSupportTicket(
        input({ requesterEmail: 'fresh@acme.test' }),
        'PORTAL',
        'one-connection',
      ),
    ).rejects.toThrow('Too many tickets from this connection');
    await expect(
      createClientSupportTicket(input({ requesterEmail: 'fresh@acme.test' }), 'PORTAL', 'another'),
    ).resolves.toMatch(/^EXY-/);
  });

  it('records the channel it was raised on', async () => {
    const reference = await createClientSupportTicket(input(), 'AGENT');

    expect((await SupportTicketModel.findOne({ reference }).lean())?.channel).toBe('AGENT');
  });
});

describe('fileClientTicket', () => {
  it('takes the client a signed-in contact already names without searching the book', async () => {
    await ClientModel.create({
      name: 'Other Co',
      email: 'dana@acme.test',
      phone: '1',
      company: 'O',
    });

    const ticket = await fileClientTicket(input(), 'PORTAL', [], {
      id: 'client-7',
      name: 'Acme Ltd',
    });

    expect(ticket.toObject()).toMatchObject({
      clientId: 'client-7',
      clientName: 'Acme Ltd',
      channel: 'PORTAL',
    });
  });

  it('files with no attachments by default', async () => {
    const ticket = await fileClientTicket(input(), 'EMAIL');

    expect(ticket.attachments).toHaveLength(0);
    expect(ticket.dueAt).toBeNull();
  });
});
