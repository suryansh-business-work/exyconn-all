import { Types } from 'mongoose';
import { websiteChatLibraryResolvers } from '../../../../src/modules/website-chat/chat.library';
import { announceWidgetConfig } from '../../../../src/modules/website-chat/chat.settings';
import { forgetKnowledgeCache } from '../../../../src/modules/website-chat/chat.retrieve';
import { ChatKnowledgeModel } from '../../../../src/modules/website-chat/models';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { Role } from '../../../../src/constants/roles';
import { codeOf } from '../codeOf';
import { useChatOperator } from './chat.fixtures';

jest.mock('../../../../src/modules/website-chat/chat.settings', () => ({
  announceWidgetConfig: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.retrieve', () => ({
  forgetKnowledgeCache: jest.fn(),
}));

const operatorId = useChatOperator();

type Resolver = (parent: unknown, args: unknown, ctx: GraphQLContext) => Promise<unknown>;
const Query = websiteChatLibraryResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = websiteChatLibraryResolvers.Mutation as unknown as Record<string, Resolver>;

const ctxIn = (organizationId: string, roles: Role[] = ['WEBSITE']): GraphQLContext => ({
  user: {
    id: new Types.ObjectId().toHexString(),
    email: 'web@exyconn.test',
    roles,
    organizationId,
  },
  organizationId,
});

const faq = { question: 'Do you build apps?', answer: 'Yes.', sortOrder: 1, isActive: true };
const knowledge = { title: 'Office hours', content: 'We work 9 to 6.', isActive: true };

describe('chat FAQs', () => {
  it('creates, edits and deletes FAQs, refreshing open widgets after each', async () => {
    const ctx = ctxIn(operatorId);
    const created = (await Mutation.createWebsiteChatFaq(null, { input: faq }, ctx)) as {
      id: string;
    };
    expect(created).toMatchObject({ question: 'Do you build apps?' });
    expect(announceWidgetConfig).toHaveBeenCalledTimes(1);

    await Mutation.updateWebsiteChatFaq(
      null,
      { id: created.id, input: { ...faq, answer: 'Often.' } },
      ctx,
    );
    expect(await Query.getWebsiteChatFaq(null, { id: created.id }, ctx)).toMatchObject({
      answer: 'Often.',
    });
    expect(await Query.listWebsiteChatFaqs(null, {}, ctx)).toHaveLength(1);

    await expect(Mutation.deleteWebsiteChatFaq(null, { id: created.id }, ctx)).resolves.toBe(true);
    expect(announceWidgetConfig).toHaveBeenCalledTimes(3);
    expect(forgetKnowledgeCache).not.toHaveBeenCalled();
  });

  it('refreshes nothing when the write fails', async () => {
    const ctx = ctxIn(operatorId);
    const missing = new Types.ObjectId().toHexString();
    expect(
      await codeOf(Mutation.updateWebsiteChatFaq(null, { id: missing, input: faq }, ctx)),
    ).toBe('NOT_FOUND');
    expect(announceWidgetConfig).not.toHaveBeenCalled();
  });

  it("is confined to the operator's website team", async () => {
    const outsider = ctxIn(new Types.ObjectId().toHexString());
    expect(await codeOf(Query.listWebsiteChatFaqs(null, {}, outsider))).toBe('FORBIDDEN');
    expect(await codeOf(Mutation.createWebsiteChatFaq(null, { input: faq }, outsider))).toBe(
      'FORBIDDEN',
    );
    const employee = ctxIn(operatorId, ['EMPLOYEE']);
    expect(await codeOf(Query.listWebsiteChatFaqs(null, {}, employee))).toBe('FORBIDDEN');
    expect(announceWidgetConfig).not.toHaveBeenCalled();
  });
});

describe('chat knowledge', () => {
  it("files knowledge written in the portal as the team's own, and the bot forgets its copy", async () => {
    const ctx = ctxIn(operatorId);
    const created = (await Mutation.createWebsiteChatKnowledge(
      null,
      { input: { ...knowledge, source: 'WEBSITE' } },
      ctx,
    )) as { id: string };
    expect((await ChatKnowledgeModel.findById(created.id).lean())?.source).toBe('CUSTOM');
    expect(forgetKnowledgeCache).toHaveBeenCalledTimes(1);

    await Mutation.updateWebsiteChatKnowledge(null, { id: created.id, input: knowledge }, ctx);
    await Mutation.deleteWebsiteChatKnowledge(null, { id: created.id }, ctx);
    expect(forgetKnowledgeCache).toHaveBeenCalledTimes(3);
    expect(announceWidgetConfig).not.toHaveBeenCalled();
  });

  it('pages and counts the knowledge', async () => {
    const ctx = ctxIn(operatorId);
    await ChatKnowledgeModel.create([
      { ...knowledge, source: 'WEBSITE' },
      { ...knowledge, title: 'Mine', source: 'CUSTOM' },
    ]);
    const page = (await Query.listWebsiteChatKnowledgeEntriesPaged(
      null,
      { input: { page: 0, pageSize: 10 } },
      ctx,
    )) as { totalCount: number };
    expect(page.totalCount).toBe(2);
    const stats = (await Query.listWebsiteChatKnowledgeEntriesStats(null, {}, ctx)) as {
      total: number;
    };
    expect(stats.total).toBe(2);
    expect(await Query.listWebsiteChatKnowledgeEntries(null, {}, ctx)).toHaveLength(2);
  });
});
