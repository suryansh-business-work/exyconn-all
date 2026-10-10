import { supportResolvers } from '../../src/modules/support';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { emailer } from '../../src/modules/email';
import { ROLES } from '../../src/constants/roles';
import { seedUser } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';
import type { TableQueryInput } from '../../src/utils/tableQuery';
import { Types } from 'mongoose';

jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn() },
}));

const sendEmail = emailer.send as jest.Mock;

/** The console is support-team only, so every call needs a context that holds the role. */
const asSupport = (id: string): GraphQLContext => ({
  user: { id, roles: [ROLES.SUPPORT], email: 'agent@exyconn.com' },
});

/**
 * A support-team member. `seedUser` is the shared helper — the model needs a
 * password hash, so a user cannot be inserted with a plain object.
 */
const supportAgent = () => seedUser('asha@exyconn.com', 'a-strong-password', [ROLES.SUPPORT]);

const ticketFor = (employeeId: string) =>
  SupportTicketModel.create({
    employeeId,
    subject: 'Laptop will not boot',
    category: 'IT',
    description: 'It stops at the logo.',
    priority: 'HIGH',
  });

describe('Support console', () => {
  it('starts a ticket unassigned', async () => {
    const ticket = await ticketFor('emp-1');

    expect(ticket.assigneeId).toBe('');
    expect(ticket.assigneeName).toBe('');
  });

  it('records both the id and the name when a ticket is assigned', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    const updated = await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: ticket._id.toHexString(), assigneeId: agent._id.toHexString() },
      asSupport(agent._id.toHexString()),
    );

    expect((updated as { assigneeName: string }).assigneeName).toBe(agent.name);
  });

  it('puts a ticket back in the queue when assigned to nobody', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(agent._id.toHexString());
    await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: ticket._id.toHexString(), assigneeId: agent._id.toHexString() },
      ctx,
    );

    const cleared = await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: ticket._id.toHexString(), assigneeId: '' },
      ctx,
    );

    expect((cleared as { assigneeId: string; assigneeName: string }).assigneeId).toBe('');
    expect((cleared as { assigneeName: string }).assigneeName).toBe('');
  });

  it('stores the author name on a reply so the thread reads later', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: '  Looking into it now.  ', internal: false },
      asSupport(agent._id.toHexString()),
    );

    const saved = await SupportReplyModel.findOne({ ticketId: ticket._id.toHexString() }).lean();
    expect(saved?.authorName).toBe(agent.name);
    expect(saved?.body).toBe('Looking into it now.');
    expect(saved?.internal).toBe(false);
  });

  it('refuses an empty reply', async () => {
    const ticket = await ticketFor('emp-1');

    await expect(
      supportResolvers.Mutation.addSupportReply(
        null,
        { ticketId: ticket._id.toHexString(), body: '   ', internal: false },
        asSupport('agent-1'),
      ),
    ).rejects.toThrow();
  });

  it('returns the thread oldest first', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(agent._id.toHexString());
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: 'First', internal: false },
      ctx,
    );
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: 'Second', internal: true },
      ctx,
    );

    const thread = (await supportResolvers.Query.listSupportReplies(
      null,
      { ticketId: ticket._id.toHexString() },
      ctx,
    )) as Array<{ body: string }>;

    expect(thread.map((reply) => reply.body)).toEqual(['First', 'Second']);
  });

  it('emails the employee when the team replies', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(employee._id.toHexString());
    sendEmail.mockResolvedValue(undefined);

    await supportResolvers.Mutation.addSupportReply(
      null,
      {
        ticketId: ticket._id.toHexString(),
        body: 'Try holding the power button.',
        internal: false,
      },
      asSupport(agent._id.toHexString()),
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      template: 'support-reply',
      to: 'emp@exyconn.com',
      variables: {
        ticketSubject: 'Laptop will not boot',
        replyBody: 'Try holding the power button.',
      },
    });
  });

  it('never emails an internal note', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(employee._id.toHexString());

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: 'Probably the battery.', internal: true },
      asSupport(agent._id.toHexString()),
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('keeps the reply when the email fails', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(employee._id.toHexString());
    sendEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      supportResolvers.Mutation.addSupportReply(
        null,
        { ticketId: ticket._id.toHexString(), body: 'On it.', internal: false },
        asSupport(agent._id.toHexString()),
      ),
    ).resolves.toBeTruthy();

    expect(await SupportReplyModel.countDocuments({ ticketId: ticket._id.toHexString() })).toBe(1);
  });

  it('stamps the first response only on a public reply', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor(new Types.ObjectId().toHexString());
    const ctx = asSupport(agent._id.toHexString());

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: 'Probably the battery.', internal: true },
      ctx,
    );
    expect((await SupportTicketModel.findById(ticket._id).lean())?.firstRespondedAt).toBeNull();

    await supportResolvers.Mutation.addSupportReply(
      null,
      {
        ticketId: ticket._id.toHexString(),
        body: 'Try holding the power button.',
        internal: false,
      },
      ctx,
    );
    const answered = await SupportTicketModel.findById(ticket._id).lean();
    expect(answered?.firstRespondedAt).toBeInstanceOf(Date);

    // A second public reply is not a first response, so the stamp must not move.
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: ticket._id.toHexString(), body: 'Any luck?', internal: false },
      ctx,
    );
    const later = await SupportTicketModel.findById(ticket._id).lean();
    expect(later?.firstRespondedAt).toEqual(answered?.firstRespondedAt);
  });

  it('stores the files posted with a reply against the author', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    await supportResolvers.Mutation.addSupportReply(
      null,
      {
        ticketId: ticket._id.toHexString(),
        body: 'Here is the driver.',
        internal: false,
        attachments: [
          {
            url: 'https://cdn.test/driver.pdf',
            name: ' driver.pdf ',
            contentType: 'application/pdf',
          },
        ],
      },
      asSupport(agent._id.toHexString()),
    );

    const saved = await SupportReplyModel.findOne({ ticketId: ticket._id.toHexString() }).lean();
    expect(saved?.attachments).toHaveLength(1);
    expect(saved?.attachments[0]).toMatchObject({
      url: 'https://cdn.test/driver.pdf',
      name: 'driver.pdf',
      uploadedBy: agent.name,
    });
  });
});

describe('Support console grid', () => {
  const page = (input: Partial<TableQueryInput>, ctx: GraphQLContext) =>
    supportResolvers.Query.listSupportTicketsPaged(
      null,
      { input: { page: 0, pageSize: 20, ...input } },
      ctx,
    ) as Promise<{ rows: Array<Record<string, unknown>>; totalCount: number }>;

  it('pages tickets with the employee name resolved', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    await ticketFor(employee._id.toHexString());
    await ticketFor(new Types.ObjectId().toHexString());

    const result = await page({}, asSupport(agent._id.toHexString()));

    expect(result.totalCount).toBe(2);
    const names = result.rows.map((row) => row.employeeName);
    expect(names).toEqual(expect.arrayContaining(['emp', null]));
  });

  it("filters the unassigned queue and one agent's own tickets", async () => {
    const agent = await supportAgent();
    const ctx = asSupport(agent._id.toHexString());
    const other = new Types.ObjectId().toHexString();
    const mine = await ticketFor(agent._id.toHexString());
    await ticketFor(other);
    await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: mine._id.toHexString(), assigneeId: agent._id.toHexString() },
      ctx,
    );

    const unassigned = await page(
      { filters: [{ field: 'assigneeId', op: 'EQUALS', value: '' }] },
      ctx,
    );
    const own = await page(
      { filters: [{ field: 'assigneeId', op: 'EQUALS', value: agent._id.toHexString() }] },
      ctx,
    );

    expect(unassigned.totalCount).toBe(1);
    expect(unassigned.rows[0].employeeId).toBe(other);
    expect(own.totalCount).toBe(1);
    expect(own.rows[0].id).toBe(mine._id.toHexString());
  });

  it('counts tickets by status, priority and category in one call', async () => {
    const agent = await supportAgent();
    await ticketFor('emp-1');
    await SupportTicketModel.create({
      employeeId: 'emp-2',
      subject: 'Payslip missing',
      category: 'PAYROLL',
      description: 'No slip for August.',
      priority: 'LOW',
      status: 'RESOLVED',
    });

    const stats = (await supportResolvers.Query.listSupportTicketsStats(
      null,
      {},
      asSupport(agent._id.toHexString()),
    )) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    expect(stats.total).toBe(2);
    const bucket = (field: string, value: string) =>
      stats.counts.find((c) => c.field === field)?.buckets.find((b) => b.value === value)?.count;
    expect(bucket('status', 'OPEN')).toBe(1);
    expect(bucket('priority', 'HIGH')).toBe(1);
    expect(bucket('category', 'PAYROLL')).toBe(1);
  });

  it('re-triages a ticket to another team and priority', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    const updated = (await supportResolvers.Mutation.setSupportTicketTriage(
      null,
      { id: ticket._id.toHexString(), category: 'HR', priority: 'LOW' },
      asSupport(agent._id.toHexString()),
    )) as { category: string; priority: string };

    expect(updated).toMatchObject({ category: 'HR', priority: 'LOW' });
  });

  it('refuses to triage into a category that does not exist', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    await expect(
      supportResolvers.Mutation.setSupportTicketTriage(
        null,
        { id: ticket._id.toHexString(), category: 'LEGAL', priority: 'LOW' },
        asSupport(agent._id.toHexString()),
      ),
    ).rejects.toThrow();
  });

  it('separates the customer queue from the employee queue', async () => {
    const agent = await supportAgent();
    const ctx = asSupport(agent._id.toHexString());
    await ticketFor(new Types.ObjectId().toHexString());
    await SupportTicketModel.create({
      requesterType: 'CLIENT',
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      clientName: 'Acme Ltd',
      reference: 'EXY-ABC234',
      subject: 'Portal will not load',
      category: 'OTHER',
      description: 'Every page hangs.',
      priority: 'HIGH',
    });

    const customers = await page(
      { filters: [{ field: 'requesterType', op: 'EQUALS', value: 'CLIENT' }] },
      ctx,
    );
    const employees = await page(
      { filters: [{ field: 'requesterType', op: 'EQUALS', value: 'EMPLOYEE' }] },
      ctx,
    );

    expect(customers.totalCount).toBe(1);
    expect(customers.rows[0].clientName).toBe('Acme Ltd');
    expect(employees.totalCount).toBe(1);
    expect(employees.rows[0].requesterEmail).toBe('');
  });

  it('counts an employee ticket written before requesterType existed as an employee ticket', async () => {
    const agent = await supportAgent();
    await ticketFor(new Types.ObjectId().toHexString());
    await SupportTicketModel.collection.updateMany({}, { $unset: { requesterType: '' } });

    const employees = await page(
      { filters: [{ field: 'requesterType', op: 'EQUALS', value: 'EMPLOYEE' }] },
      asSupport(agent._id.toHexString()),
    );

    expect(employees.totalCount).toBe(1);
  });

  it('lists only what is unresolved and past its deadline as overdue', async () => {
    const agent = await supportAgent();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const overdue = await ticketFor(new Types.ObjectId().toHexString());
    await SupportTicketModel.updateOne({ _id: overdue._id }, { dueAt: hourAgo });
    const late = await ticketFor(new Types.ObjectId().toHexString());
    await SupportTicketModel.updateOne(
      { _id: late._id },
      { dueAt: hourAgo, resolvedAt: new Date(), status: 'RESOLVED' },
    );
    await ticketFor(new Types.ObjectId().toHexString());

    const result = await page(
      { filters: [{ field: 'slaState', op: 'EQUALS', value: 'BREACHED' }] },
      asSupport(agent._id.toHexString()),
    );

    expect(result.totalCount).toBe(1);
    expect(result.rows[0].id).toBe(overdue._id.toHexString());
  });
});
