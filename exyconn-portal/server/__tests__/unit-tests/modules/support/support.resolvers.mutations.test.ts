import { Types } from 'mongoose';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { supportResolvers } from '../../../../src/modules/support/support.resolvers';
import { resetClientTicketLimits } from '../../../../src/modules/support/client-ticket.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const M = supportResolvers.Mutation as unknown as Record<string, Resolver>;

const asSupport = (id = new Types.ObjectId().toHexString()): GraphQLContext => ({
  user: { id, email: 'desk@exyconn.com', roles: [ROLES.SUPPORT] },
});

const ticket = () =>
  SupportTicketModel.create({
    employeeId: '',
    subject: 'Laptop will not boot',
    category: 'IT',
    description: 'It stops at the logo.',
  });

/** The ticket vanishes between the read and the write — a concurrent delete. */
const deletedMidWrite = () =>
  jest
    .spyOn(SupportTicketModel, 'findByIdAndUpdate')
    .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('writes that lose the ticket half way', () => {
  it('report a 404 for status, triage and assignment', async () => {
    const row = await ticket();
    const id = row._id.toHexString();

    deletedMidWrite();
    await expect(
      M.setSupportTicketStatus(null, { id, status: 'CLOSED' }, asSupport()),
    ).rejects.toThrow('SupportTicket not found');
    deletedMidWrite();
    await expect(
      M.setSupportTicketTriage(null, { id, category: 'IT', priority: 'LOW' }, asSupport()),
    ).rejects.toThrow('SupportTicket not found');
    deletedMidWrite();
    await expect(M.assignSupportTicket(null, { id, assigneeId: '' }, asSupport())).rejects.toThrow(
      'SupportTicket not found',
    );
  });
});

describe('assignSupportTicket', () => {
  it('refuses to hand a ticket to an account that does not exist', async () => {
    const row = await ticket();

    await expect(
      M.assignSupportTicket(
        null,
        { id: row._id.toHexString(), assigneeId: new Types.ObjectId().toHexString() },
        asSupport(),
      ),
    ).rejects.toThrow('User not found');
    expect((await SupportTicketModel.findById(row._id).lean())?.assigneeId).toBe('');
  });
});

describe('addSupportReply', () => {
  it('signs a reply "Support" when the author has no account on file', async () => {
    const row = await ticket();

    await M.addSupportReply(
      null,
      { ticketId: row._id.toHexString(), body: 'Checking.', internal: true },
      asSupport(),
    );

    const reply = await SupportReplyModel.findOne({ ticketId: row._id.toHexString() }).lean();
    expect(reply?.authorName).toBe('Support');
  });

  it('keeps the reply when the author lookup itself fails', async () => {
    const row = await ticket();

    const saved = (await M.addSupportReply(
      null,
      { ticketId: row._id.toHexString(), body: 'Still here.', internal: true },
      asSupport('not-an-object-id'),
    )) as { authorId: string; authorName: string; id: string };

    expect(saved).toMatchObject({ authorId: 'not-an-object-id', authorName: 'Support' });
    expect(saved.id).toEqual(expect.any(String));
  });

  it('refuses an empty reply before reading the ticket', async () => {
    await expect(
      M.addSupportReply(null, { ticketId: 'nope', body: ' ', internal: false }, asSupport()),
    ).rejects.toThrow('A reply cannot be empty.');
  });
});

describe('createClientSupportTicket', () => {
  beforeEach(async () => {
    await resetClientTicketLimits();
  });

  const form = {
    requesterName: 'Dana Reyes',
    requesterEmail: 'dana@acme.test',
    subject: 'Portal will not load',
    category: 'OTHER',
    description: 'Every page hangs on the spinner since this morning.',
    priority: 'MEDIUM',
  };

  it('records a ticket an agent raises in the console as AGENT', async () => {
    const reference = (await M.createClientSupportTicket(
      null,
      { input: form },
      asSupport(),
    )) as string;

    expect((await SupportTicketModel.findOne({ reference }).lean())?.channel).toBe('AGENT');
  });

  it('records a ticket from the public form as PORTAL', async () => {
    const reference = (await M.createClientSupportTicket(
      null,
      { input: form },
      { user: null, ip: 'visitor' },
    )) as string;

    expect((await SupportTicketModel.findOne({ reference }).lean())?.channel).toBe('PORTAL');
  });
});
