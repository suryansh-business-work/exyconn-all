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
      { id: String(ticket._id), assigneeId: String(agent._id) },
      asSupport(String(agent._id)),
    );

    expect((updated as { assigneeName: string }).assigneeName).toBe(agent.name);
  });

  it('puts a ticket back in the queue when assigned to nobody', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(String(agent._id));
    await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(ticket._id), assigneeId: String(agent._id) },
      ctx,
    );

    const cleared = await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(ticket._id), assigneeId: '' },
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
      { ticketId: String(ticket._id), body: '  Looking into it now.  ', internal: false },
      asSupport(String(agent._id)),
    );

    const saved = await SupportReplyModel.findOne({ ticketId: String(ticket._id) }).lean();
    expect(saved?.authorName).toBe(agent.name);
    expect(saved?.body).toBe('Looking into it now.');
    expect(saved?.internal).toBe(false);
  });

  it('refuses an empty reply', async () => {
    const ticket = await ticketFor('emp-1');

    await expect(
      supportResolvers.Mutation.addSupportReply(
        null,
        { ticketId: String(ticket._id), body: '   ', internal: false },
        asSupport('agent-1'),
      ),
    ).rejects.toThrow();
  });

  it('returns the thread oldest first', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');
    const ctx = asSupport(String(agent._id));
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'First', internal: false },
      ctx,
    );
    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Second', internal: true },
      ctx,
    );

    const thread = (await supportResolvers.Query.listSupportReplies(
      null,
      { ticketId: String(ticket._id) },
      ctx,
    )) as Array<{ body: string }>;

    expect(thread.map((reply) => reply.body)).toEqual(['First', 'Second']);
  });

  it('emails the employee when the team replies', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(String(employee._id));
    sendEmail.mockResolvedValue(undefined);

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Try holding the power button.', internal: false },
      asSupport(String(agent._id)),
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      template: 'support-reply',
      to: 'emp@exyconn.com',
      variables: { ticketSubject: 'Laptop will not boot', replyBody: 'Try holding the power button.' },
    });
  });

  it('never emails an internal note', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(String(employee._id));

    await supportResolvers.Mutation.addSupportReply(
      null,
      { ticketId: String(ticket._id), body: 'Probably the battery.', internal: true },
      asSupport(String(agent._id)),
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('keeps the reply when the email fails', async () => {
    const agent = await supportAgent();
    const employee = await seedUser('emp@exyconn.com', 'a-strong-password', [ROLES.EMPLOYEE]);
    const ticket = await ticketFor(String(employee._id));
    sendEmail.mockRejectedValue(new Error('SMTP down'));

    await expect(
      supportResolvers.Mutation.addSupportReply(
        null,
        { ticketId: String(ticket._id), body: 'On it.', internal: false },
        asSupport(String(agent._id)),
      ),
    ).resolves.toBeTruthy();

    expect(await SupportReplyModel.countDocuments({ ticketId: String(ticket._id) })).toBe(1);
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
    await ticketFor(String(employee._id));
    await ticketFor(String(new Types.ObjectId()));

    const result = await page({}, asSupport(String(agent._id)));

    expect(result.totalCount).toBe(2);
    const names = result.rows.map((row) => row.employeeName);
    expect(names).toEqual(expect.arrayContaining(['emp', null]));
  });

  it('filters the unassigned queue and one agent\'s own tickets', async () => {
    const agent = await supportAgent();
    const ctx = asSupport(String(agent._id));
    const other = String(new Types.ObjectId());
    const mine = await ticketFor(String(agent._id));
    await ticketFor(other);
    await supportResolvers.Mutation.assignSupportTicket(
      null,
      { id: String(mine._id), assigneeId: String(agent._id) },
      ctx,
    );

    const unassigned = await page(
      { filters: [{ field: 'assigneeId', op: 'EQUALS', value: '' }] },
      ctx,
    );
    const own = await page(
      { filters: [{ field: 'assigneeId', op: 'EQUALS', value: String(agent._id) }] },
      ctx,
    );

    expect(unassigned.totalCount).toBe(1);
    expect(unassigned.rows[0].employeeId).toBe(other);
    expect(own.totalCount).toBe(1);
    expect(own.rows[0].id).toBe(String(mine._id));
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
      asSupport(String(agent._id)),
    )) as { total: number; counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }> };

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
      { id: String(ticket._id), category: 'HR', priority: 'LOW' },
      asSupport(String(agent._id)),
    )) as { category: string; priority: string };

    expect(updated).toMatchObject({ category: 'HR', priority: 'LOW' });
  });

  it('refuses to triage into a category that does not exist', async () => {
    const agent = await supportAgent();
    const ticket = await ticketFor('emp-1');

    await expect(
      supportResolvers.Mutation.setSupportTicketTriage(
        null,
        { id: String(ticket._id), category: 'LEGAL', priority: 'LOW' },
        asSupport(String(agent._id)),
      ),
    ).rejects.toThrow();
  });
});
