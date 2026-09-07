import { supportResolvers } from '../../src/modules/support';
import {
  createClientSupportTicket,
  resetClientTicketLimits,
} from '../../src/modules/support/client-ticket.service';
import { uniqueReference } from '../../src/modules/support/ticket-reference';
import { ensureSupportSlaPolicies } from '../../src/modules/support/sla.service';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { emailer } from '../../src/modules/email';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendEmail = emailer.send as jest.Mock;

const asSupport = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.SUPPORT], email: 'agent@exyconn.com' },
});

/** The password only has to exist for the fixture; it is never used to sign in here. */
const AGENT_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'a-strong-password';
const supportAgent = () => seedUser('asha@exyconn.com', AGENT_PASSWORD, [ROLES.SUPPORT]);

const validInput = (overrides: Record<string, string> = {}) => ({
  requesterName: 'Dana Reyes',
  requesterEmail: 'dana@acme.test',
  subject: 'Portal will not load',
  category: 'OTHER',
  description: 'Every page hangs on the spinner since this morning, on two machines.',
  priority: 'HIGH',
  ...overrides,
});

beforeEach(() => {
  resetClientTicketLimits();
});

describe('Customer tickets', () => {
  it('files the ticket and hands back only a reference', async () => {
    const reference = await createClientSupportTicket(validInput());

    expect(reference).toMatch(/^EXY-[A-Z2-9]{6}$/);
    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    expect(ticket).toMatchObject({
      requesterType: 'CLIENT',
      requesterEmail: 'dana@acme.test',
      employeeId: '',
      status: 'OPEN',
    });
  });

  it('stamps a deadline from the policy for its priority', async () => {
    await ensureSupportSlaPolicies();

    const reference = await createClientSupportTicket(validInput());

    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    expect(ticket?.dueAt).toBeInstanceOf(Date);
  });

  it('attributes the ticket to a client matched by exact address', async () => {
    await ClientModel.create({
      name: 'Acme Ltd',
      email: 'dana@acme.test',
      phone: '123',
      company: 'Acme',
    });

    const reference = await createClientSupportTicket(validInput());

    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    expect(ticket?.clientName).toBe('Acme Ltd');
    expect(ticket?.clientId).toBeTruthy();
  });

  it('attributes a colleague at the same domain to the same client', async () => {
    await ClientModel.create({
      name: 'Acme Ltd',
      email: 'buyer@acme.test',
      phone: '123',
      company: 'Acme',
    });

    const reference = await createClientSupportTicket(validInput());

    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    expect(ticket?.clientName).toBe('Acme Ltd');
  });

  it('files a ticket for an address nobody on file matches', async () => {
    const reference = await createClientSupportTicket(validInput());

    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    expect(ticket?.clientId).toBe('');
    expect(ticket?.clientName).toBe('');
  });

  it('refuses a description that says nothing and an address that is not one', async () => {
    await expect(createClientSupportTicket(validInput({ description: 'broken' }))).rejects.toThrow(
      /Description/,
    );
    await expect(createClientSupportTicket(validInput({ requesterEmail: 'nope' }))).rejects.toThrow(
      /valid email/,
    );
  });

  it('stops one address filing tickets forever', async () => {
    for (let i = 0; i < 5; i += 1) {
      await createClientSupportTicket(validInput({ subject: `Portal will not load ${i}` }));
    }

    await expect(createClientSupportTicket(validInput())).rejects.toThrow(/Too many tickets/);
    // Somebody else is unaffected: the limit is per address, not global.
    await expect(
      createClientSupportTicket(validInput({ requesterEmail: 'other@acme.test' })),
    ).resolves.toBeTruthy();
  });

  it('gives every ticket its own reference', async () => {
    const references = new Set<string>();
    for (let i = 0; i < 25; i += 1) {
      references.add(await uniqueReference());
    }

    expect(references.size).toBe(25);
  });
});

describe('Replying to a customer', () => {
  it('emails the requester rather than looking up an employee', async () => {
    const agent = await supportAgent();
    const reference = await createClientSupportTicket(validInput());
    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    sendEmail.mockResolvedValue(undefined);

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket?._id), body: 'We are on it.', internal: false },
      asSupport(String(agent._id)),
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      template: 'support-reply-client',
      to: 'dana@acme.test',
      variables: { name: 'Dana Reyes', reference, replyBody: 'We are on it.' },
    });
  });

  it('never emails an internal note on a customer ticket', async () => {
    const agent = await supportAgent();
    const reference = await createClientSupportTicket(validInput());
    const ticket = await SupportTicketModel.findOne({ reference }).lean();

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket?._id), body: 'Looks like their proxy.', internal: true },
      asSupport(String(agent._id)),
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe('Following a customer ticket', () => {
  const status = (reference: string, email: string) =>
    supportResolvers.Query.clientSupportTicketStatus(null, { reference, email }) as Promise<{
      status: string;
      subject: string;
      replies: Array<{ body: string }>;
    } | null>;

  it('shows the ticket to the address that raised it', async () => {
    const agent = await supportAgent();
    const reference = await createClientSupportTicket(validInput());
    const ticket = await SupportTicketModel.findOne({ reference }).lean();
    sendEmail.mockResolvedValue(undefined);
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket?._id), body: 'Public answer', internal: false },
      asSupport(String(agent._id)),
    );
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket?._id), body: 'Team only', internal: true },
      asSupport(String(agent._id)),
    );

    const result = await status(reference, 'DANA@acme.test');

    expect(result).toMatchObject({ status: 'OPEN', subject: 'Portal will not load' });
    expect(result?.replies.map((reply) => reply.body)).toEqual(['Public answer']);
  });

  it('refuses the wrong address, and a reference nobody was given', async () => {
    const reference = await createClientSupportTicket(validInput());

    expect(await status(reference, 'someone@else.test')).toBeNull();
    expect(await status('EXY-ZZZZZZ', 'dana@acme.test')).toBeNull();
  });
});
