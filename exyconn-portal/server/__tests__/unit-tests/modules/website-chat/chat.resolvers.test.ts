import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { websiteChatResolvers } from '../../../../src/modules/website-chat/chat.resolvers';
import { syncWebsiteKnowledge } from '../../../../src/modules/website-chat/chat.knowledge';
import { forgetKnowledgeCache } from '../../../../src/modules/website-chat/chat.retrieve';
import { ChatMessageModel, ChatSessionModel } from '../../../../src/modules/website-chat/models';
import { UserModel } from '../../../../src/modules/admin/user.model';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { Role } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { createSession, useChatOperator, validSettings } from './chat.fixtures';

jest.mock('../../../../src/modules/website-chat/chat.knowledge', () => ({
  syncWebsiteKnowledge: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.retrieve', () => ({
  forgetKnowledgeCache: jest.fn(),
}));
jest.mock('../../../../src/modules/email/email.service', () => ({ emailer: { send: jest.fn() } }));

const operatorId = useChatOperator();
const { Query, Mutation } = websiteChatResolvers;
const adminId = String(new Types.ObjectId());
/** A website team member of the operator's company: the people this console is for. */
const agentUser = {
  id: adminId,
  email: 'root@exyconn.test',
  roles: ['WEBSITE'] as Role[],
  organizationId: operatorId,
};
const admin: GraphQLContext = { user: agentUser, organizationId: operatorId };

const person = (name: string, roles: Role[], fields: Record<string, unknown> = {}) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.test`,
    passwordHash: randomUUID(),
    roles,
    ...fields,
  });

const page = { page: 0, pageSize: 10 };

describe('website chat queries', () => {
  it('pages and counts the sessions', async () => {
    await createSession({ name: 'Ann', site: 'TOOLS' });
    await createSession({ name: 'Bob', status: 'CLOSED' });
    const result = await Query.websiteChatSessionsPaged(null, { input: page }, admin);
    expect(result.totalCount).toBe(2);
    expect(result.rows.map((row) => (row as { id: string }).id)).toHaveLength(2);

    const stats = await Query.websiteChatSessionStats(null, null, admin);
    expect(stats.total).toBe(2);
    expect(stats.counts.find((count) => count.field === 'site')?.buckets).toEqual(
      expect.arrayContaining([
        { value: 'TOOLS', count: 1 },
        { value: 'WEBSITE', count: 1 },
      ]),
    );
  });

  it('reads one session and its conversation, refusing an unknown one', async () => {
    const session = await createSession({ tokenVersion: 4 });
    const id = String(session._id);
    await ChatMessageModel.create({
      sessionId: id,
      channel: 'LIVE',
      sender: 'VISITOR',
      body: 'Hi',
    });
    const found = await Query.websiteChatSession(null, { id }, admin);
    expect(found).toMatchObject({ id, name: 'Dana Reyes' });
    expect(found).not.toHaveProperty('tokenVersion');
    expect(
      (await Query.websiteChatMessages(null, { sessionId: id }, admin)).map((m) => m.body),
    ).toEqual(['Hi']);
    expect(
      await codeOf(Query.websiteChatSession(null, { id: String(new Types.ObjectId()) }, admin)),
    ).toBe('NOT_FOUND');
  });

  it('shows the settings with whether the team is online', async () => {
    const settings = await Query.websiteChatSettings(null, null, admin);
    expect(settings).toMatchObject({ botName: 'Exyconn Assistant' });
    expect(typeof settings.online).toBe('boolean');
  });

  it('offers the support and website people of the company as agents, by name', async () => {
    await person('Zed', ['SUPPORT']);
    await person('Amy', ['WEBSITE']);
    await person('Eve', ['EMPLOYEE']);
    await person('Bea', ['WEBSITE'], { isBlocked: true });
    const candidates = await Query.websiteChatAgentCandidates(null, null, admin);
    expect(candidates.map((agent) => agent.name)).toEqual(['Amy', 'Zed']);
    expect(candidates[0]).toMatchObject({ openChats: 0, online: false });
  });

  it("refuses anyone outside the operator's company", async () => {
    const outsider: GraphQLContext = {
      user: {
        id: adminId,
        email: 'x@acme.test',
        roles: ['WEBSITE'],
        organizationId: String(new Types.ObjectId()),
      },
      organizationId: null,
    };
    expect(await codeOf(Query.websiteChatSettings(null, null, outsider))).toBe('FORBIDDEN');
    const employee: GraphQLContext = {
      user: { ...agentUser, roles: ['EMPLOYEE'] },
      organizationId: operatorId,
    };
    expect(await codeOf(Mutation.deleteWebsiteChatSession(null, { id: adminId }, employee))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('website chat mutations', () => {
  it('saves the settings', async () => {
    const saved = await Mutation.updateWebsiteChatSettings(
      null,
      { input: { ...validSettings(), botName: 'Exy' } },
      admin,
    );
    expect(saved.botName).toBe('Exy');
  });

  it("claims and closes a chat in the agent's name", async () => {
    await person('Root', ['WEBSITE'], { _id: adminId });
    const session = await createSession();
    const id = String(session._id);
    expect(await Mutation.claimWebsiteChatSession(null, { id }, admin)).toMatchObject({
      assigneeId: adminId,
      assigneeName: 'Root',
    });
    expect(await Mutation.closeWebsiteChatSession(null, { id }, admin)).toMatchObject({
      status: 'CLOSED',
      closedBy: 'Root',
    });
  });

  it('deletes a chat with its messages, refusing one that is gone', async () => {
    const session = await createSession();
    const id = String(session._id);
    await ChatMessageModel.create({
      sessionId: id,
      channel: 'LIVE',
      sender: 'VISITOR',
      body: 'Hi',
    });
    await expect(Mutation.deleteWebsiteChatSession(null, { id }, admin)).resolves.toBe(true);
    expect(await ChatSessionModel.countDocuments()).toBe(0);
    expect(await ChatMessageModel.countDocuments()).toBe(0);
    expect(await codeOf(Mutation.deleteWebsiteChatSession(null, { id }, admin))).toBe('NOT_FOUND');
  });

  it('syncs the knowledge and forgets the cached copy', async () => {
    const result = { count: 3, syncedAt: new Date() };
    (syncWebsiteKnowledge as jest.Mock).mockResolvedValue(result);
    await expect(Mutation.syncWebsiteChatKnowledge(null, null, admin)).resolves.toBe(result);
    expect(forgetKnowledgeCache).toHaveBeenCalledTimes(1);
  });
});
