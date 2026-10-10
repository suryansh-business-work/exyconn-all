import { Types } from 'mongoose';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { supportResolvers } from '../../../../src/modules/support/support.resolvers';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = supportResolvers.Query as unknown as Record<string, Resolver>;

const HOUR = 60 * 60 * 1000;

const ctx = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'desk@exyconn.com', roles },
});

async function person(name: string, roles: string[]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles,
  });
  return user._id.toHexString();
}

const ticket = (category: string, extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: '',
    subject: `${category} problem`,
    category,
    description: 'Help',
    ...extra,
  });

describe('listSupportTickets', () => {
  it('lists the whole queue newest first, with employee names where there is one', async () => {
    const ravi = await person('Ravi Kumar', [ROLES.EMPLOYEE]);
    await ticket('HR', { employeeId: ravi, createdAt: new Date(Date.now() - 2 * HOUR) });
    await ticket('IT', { createdAt: new Date(Date.now() - HOUR) });

    const rows = (await Q.listSupportTickets(null, {}, ctx([ROLES.SUPPORT]))) as Array<{
      category: string;
      employeeName: string | null;
      id: string;
    }>;

    expect(rows.map((row) => [row.category, row.employeeName])).toEqual([
      ['IT', null],
      ['HR', 'Ravi Kumar'],
    ]);
    expect(rows[0].id).toEqual(expect.any(String));
  });

  it('gives an IT-only caller nothing but the IT queue', async () => {
    await ticket('HR');
    await ticket('IT');

    const rows = (await Q.listSupportTickets(null, {}, ctx([ROLES.IT]))) as Array<{
      category: string;
    }>;

    expect(rows.map((row) => row.category)).toEqual(['IT']);
  });

  it('is closed to somebody outside the desk', async () => {
    await expect(Q.listSupportTickets(null, {}, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});

describe('listSupportAgents', () => {
  it('offers IT staff for an IT ticket and the support desk for anything else', async () => {
    const ira = await person('Ira Tech', [ROLES.IT]);
    const sam = await person('Sam Desk', [ROLES.SUPPORT]);
    const asSupport = ctx([ROLES.SUPPORT]);

    const forIt = (await Q.listSupportAgents(null, { category: 'IT' }, asSupport)) as Array<{
      id: string;
    }>;
    const forHr = (await Q.listSupportAgents(null, { category: 'HR' }, asSupport)) as Array<{
      id: string;
    }>;
    const unspecified = (await Q.listSupportAgents(null, {}, asSupport)) as Array<{ id: string }>;

    expect(forIt.map((agent) => agent.id)).toEqual([ira]);
    expect(forHr.map((agent) => agent.id)).toEqual([sam]);
    expect(unspecified.map((agent) => agent.id)).toEqual([sam]);
  });

  it('sorts agents by name', async () => {
    await person('Zed Desk', [ROLES.SUPPORT]);
    await person('Amy Desk', [ROLES.SUPPORT]);

    const agents = (await Q.listSupportAgents(null, {}, ctx([ROLES.SUPPORT]))) as Array<{
      name: string;
    }>;

    expect(agents.map((agent) => agent.name)).toEqual(['Amy Desk', 'Zed Desk']);
  });
});

describe('getSupportTicket and listSupportReplies', () => {
  it('answers a malformed id the same way as an unknown one', async () => {
    const asSupport = ctx([ROLES.SUPPORT]);

    await expect(Q.getSupportTicket(null, { id: 'nope' }, asSupport)).rejects.toThrow(
      'SupportTicket not found',
    );
    await expect(
      Q.getSupportTicket(null, { id: new Types.ObjectId().toHexString() }, asSupport),
    ).rejects.toThrow('SupportTicket not found');
    await expect(Q.listSupportReplies(null, { ticketId: 'nope' }, asSupport)).rejects.toThrow(
      'SupportTicket not found',
    );
  });
});

describe('supportSlaSummary', () => {
  it('measures only the caller’s slice of the queue', async () => {
    const past = new Date(Date.now() - HOUR);
    await ticket('IT', { dueAt: past });
    await ticket('HR', { dueAt: past });

    await expect(Q.supportSlaSummary(null, {}, ctx([ROLES.IT]))).resolves.toEqual({
      onTrack: 0,
      dueSoon: 0,
      breached: 1,
    });
    await expect(Q.supportSlaSummary(null, {}, ctx([ROLES.SUPPORT]))).resolves.toMatchObject({
      breached: 2,
    });
  });
});
