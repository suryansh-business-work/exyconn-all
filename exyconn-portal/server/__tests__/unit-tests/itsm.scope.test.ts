import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/admin/user.model';
import { SupportTicketModel } from '../../src/modules/employee/support.model';
import { supportResolvers } from '../../src/modules/support/support.resolvers';
import { supportLibraryResolvers } from '../../src/modules/support/support.library';
import { SupportReplyModel } from '../../src/modules/support/support-reply.model';
import { announcementsResolvers } from '../../src/modules/announcements';
import { policyResolvers } from '../../src/modules/legal/policy.resolvers';
import { PolicyModel } from '../../src/modules/legal/policy.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<never>;
const tickets = {
  ...(supportResolvers.Query as unknown as Record<string, Resolver>),
  ...(supportResolvers.Mutation as unknown as Record<string, Resolver>),
};
const kb = supportLibraryResolvers.Mutation as unknown as Record<string, Resolver>;
const announce = announcementsResolvers.Mutation as unknown as Record<string, Resolver>;
const policies = {
  ...(policyResolvers.Query as unknown as Record<string, Resolver>),
  ...(policyResolvers.Mutation as unknown as Record<string, Resolver>),
};

const ctx = (id: string, roles: string[]) =>
  ({ user: { id, email: `${id}@exyconn.com`, roles } }) as unknown as GraphQLContext;

const page = { input: { page: 0, pageSize: 25 } };

async function person(name: string, roles: string[]) {
  const user = await UserModel.create({
    name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@exyconn.com`,
    passwordHash: 'x',
    roles,
  });
  return String(user._id);
}

const ticket = (category: string, extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    employeeId: new Types.ObjectId().toString(),
    subject: `${category} problem`,
    category,
    description: 'Help',
    ...extra,
  });

describe('IT scope over shared registers', () => {
  useTestOrganization();
  let itCtx: GraphQLContext;
  let supportCtx: GraphQLContext;
  let itId: string;

  beforeEach(async () => {
    itId = await person('Ira Tech', [ROLES.IT]);
    itCtx = ctx(itId, [ROLES.IT]);
    supportCtx = ctx(await person('Sam Desk', [ROLES.SUPPORT]), [ROLES.SUPPORT]);
  });

  describe('tickets', () => {
    it('shows IT only the IT tickets, and support all of them', async () => {
      await ticket('IT');
      await ticket('HR');

      const forIt = (await tickets.listSupportTicketsPaged(null, page, itCtx)) as {
        rows: Array<{ category: string }>;
      };
      const forSupport = (await tickets.listSupportTicketsPaged(null, page, supportCtx)) as {
        totalCount: number;
      };

      expect(forIt.rows.map((row) => row.category)).toEqual(['IT']);
      expect(forSupport.totalCount).toBe(2);
    });

    it("will not let IT open or reply on another team's ticket", async () => {
      const hr = await ticket('HR');

      await expect(tickets.getSupportTicket(null, { id: String(hr._id) }, itCtx)).rejects.toThrow();
      await expect(
        tickets.addSupportReply(
          null,
          { ticketId: String(hr._id), body: 'hi', internal: false },
          itCtx,
        ),
      ).rejects.toThrow();
    });

    it('offers IT staff as assignees for an IT ticket', async () => {
      const agents = (await tickets.listSupportAgents(null, {}, itCtx)) as Array<{ id: string }>;

      expect(agents.map((agent) => agent.id)).toEqual([itId]);
    });

    it('escalates: HIGH priority, a level up, a note on the thread and the holder told', async () => {
      const it = await ticket('IT', { priority: 'LOW', assigneeId: itId, assigneeName: 'Ira' });

      const escalated = (await tickets.escalateSupportTicket(
        null,
        { id: String(it._id), reason: 'CEO cannot print' },
        itCtx,
      )) as { priority: string; escalationLevel: number };

      expect(escalated).toMatchObject({ priority: 'HIGH', escalationLevel: 1 });
      const note = await SupportReplyModel.findOne({ ticketId: String(it._id) }).lean();
      expect(note).toMatchObject({
        internal: true,
        body: 'Escalated to level 1: CEO cannot print',
      });
      expect(await NotificationModel.countDocuments({ employeeId: itId, kind: 'SUPPORT' })).toBe(1);
    });

    it('will not escalate a closed ticket or one with no reason', async () => {
      const closed = await ticket('IT', { status: 'CLOSED' });
      const open = await ticket('IT');

      await expect(
        tickets.escalateSupportTicket(null, { id: String(closed._id), reason: 'x' }, itCtx),
      ).rejects.toThrow('Reopen');
      await expect(
        tickets.escalateSupportTicket(null, { id: String(open._id), reason: ' ' }, itCtx),
      ).rejects.toThrow('why');
    });

    it('records a topic when IT triages', async () => {
      const it = await ticket('IT');

      const triaged = (await tickets.setSupportTicketTriage(
        null,
        { id: String(it._id), category: 'IT', priority: 'MEDIUM', topic: ' VPN ' },
        itCtx,
      )) as { topic: string };

      expect(triaged.topic).toBe('VPN');
    });
  });

  describe('knowledge base', () => {
    const article = (category: string) => ({
      title: 'Reset VPN',
      slug: `reset-vpn-${category.toLowerCase()}`,
      category,
      body: '<p>Steps</p>',
      isPublished: true,
    });

    it('lets IT write IT articles and nothing else', async () => {
      await expect(kb.createKbArticle(null, { input: article('IT') }, itCtx)).resolves.toBeTruthy();
      await expect(kb.createKbArticle(null, { input: article('HR') }, itCtx)).rejects.toThrow(
        'IT category',
      );
    });
  });

  describe('announcements', () => {
    const notice = (category: string) => ({
      title: 'Maintenance tonight',
      body: 'VPN down 10pm–11pm',
      category,
      pinned: false,
      publishedAt: new Date(),
      audience: 'ALL',
    });

    it('lets IT post maintenance, outage and security alerts only', async () => {
      await expect(
        announce.createAnnouncement(null, { input: notice('MAINTENANCE') }, itCtx),
      ).resolves.toBeTruthy();
      await expect(
        announce.createAnnouncement(null, { input: notice('EVENT') }, itCtx),
      ).rejects.toThrow('IT may only publish');
    });
  });

  describe('policies', () => {
    const policy = (slug: string, category: string, audience = 'ALL_STAFF') => ({
      title: slug,
      slug,
      body: '<p>Rules</p>',
      audience,
      category,
      effectiveDate: new Date(),
    });

    it('lists only IT and security policies for IT — never an HR-only draft', async () => {
      await PolicyModel.create([
        policy('byod', 'IT'),
        policy('passwords', 'SECURITY'),
        policy('grievance', 'HR', 'HR_ONLY'),
      ]);

      const listed = (await policies.listPoliciesPaged(null, page, itCtx)) as {
        rows: Array<{ slug: string }>;
      };

      expect(listed.rows.map((row) => row.slug).sort((a, b) => a.localeCompare(b))).toEqual([
        'byod',
        'passwords',
      ]);
    });

    it('refuses IT writing or publishing outside its categories', async () => {
      const hr = await PolicyModel.create(policy('grievance', 'HR', 'HR_ONLY'));

      await expect(
        policies.createPolicy(null, { input: policy('leave', 'HR') }, itCtx),
      ).rejects.toThrow('IT may only maintain');
      await expect(policies.publishPolicy(null, { id: String(hr._id) }, itCtx)).rejects.toThrow(
        'IT may only maintain',
      );
    });
  });
});
