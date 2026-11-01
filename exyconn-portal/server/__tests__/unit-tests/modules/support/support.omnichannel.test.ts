import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { supportOmnichannelResolvers } from '../../../../src/modules/support/support.omnichannel.resolvers';
import { ChatSessionModel } from '../../../../src/modules/website-chat/models/chat-session.model';
import { WhatsappChatModel } from '../../../../../../demos/whatsapp-demo/server/src/channel/chat.model';
import { KbArticleModel } from '../../../../src/modules/support/kb-article.model';
import { CannedReplyModel } from '../../../../src/modules/support/canned-reply.model';
import { SupportReplyModel } from '../../../../src/modules/support/support-reply.model';
import { sendCsatSurvey } from '../../../../src/modules/support/support.csat';
import { AiJobModel } from '../../../../src/modules/ai/ai.model';
import { AiSpendLimitModel } from '../../../../src/modules/ai/ai-spend-limit.model';
import { OpenAiConfigModel } from '../../../../src/modules/tech/openai-config.model';
import { openAiClient } from '../../../../src/utils/openai';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';
import { runForOrganization } from '../../../../src/lib/tenant';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/utils/openai', () => ({
  openAiClient: { complete: jest.fn(), listModels: jest.fn() },
}));
jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = supportOmnichannelResolvers.Query as unknown as Record<string, Resolver>;
const M = supportOmnichannelResolvers.Mutation as unknown as Record<string, Resolver>;

const complete = openAiClient.complete as jest.Mock;
const send = emailer.send as jest.Mock;
const sentPrompt = (): string => complete.mock.calls[0][0].prompt;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'desk@exyconn.com', roles },
});
const asSupport = as([ROLES.SUPPORT]);
const asIt = as([ROLES.IT]);

const ticket = (extra: Record<string, unknown> = {}) =>
  SupportTicketModel.create({
    requesterType: 'CLIENT',
    requesterName: 'Asha Rao',
    requesterEmail: 'asha@acme.test',
    subject: 'Refund for duplicate invoice',
    category: 'OTHER',
    description: 'I was charged twice for the same invoice.',
    ...extra,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('supportTicketSource', () => {
  const source = (id: string, ctx: GraphQLContext = asSupport) =>
    Q.supportTicketSource(null, { ticketId: id }, ctx);

  it('reads the website chat a CHAT ticket was filed from', async () => {
    const row = await ticket({ channel: 'CHAT' });
    const lastMessageAt = new Date('2026-10-30T10:00:00.000Z');
    const session = await ChatSessionModel.create({
      name: 'Asha Rao',
      email: 'asha@acme.test',
      site: 'WEBSITE',
      status: 'CLOSED',
      ticketId: row._id.toHexString(),
      lastMessagePreview: 'Any news?',
      messageCount: 7,
      lastMessageAt,
    });

    await expect(source(row._id.toHexString())).resolves.toEqual({
      channel: 'CHAT',
      contact: 'Asha Rao <asha@acme.test>',
      status: 'CLOSED',
      detail: 'Any news?',
      messageCount: 7,
      lastActivityAt: lastMessageAt,
      url: `https://agents.exyconn.com/agents/chat/sessions/${session._id.toHexString()}`,
    });
  });

  it('shows a chat with no message yet as never active', async () => {
    const row = await ticket({ channel: 'CHAT' });
    await ChatSessionModel.create({
      name: 'Asha Rao',
      email: 'asha@acme.test',
      site: 'WEBSITE',
      ticketId: row._id.toHexString(),
    });

    await expect(source(row._id.toHexString())).resolves.toMatchObject({
      lastActivityAt: null,
      messageCount: 0,
    });
  });

  it('reads the WhatsApp chat behind a WHATSAPP ticket, number masked', async () => {
    const row = await ticket({ channel: 'WHATSAPP', requesterEmail: '' });
    const lastEventAt = new Date('2026-10-31T08:00:00.000Z');
    await WhatsappChatModel.create({
      waId: '919876543210',
      name: 'Ravi',
      demoKey: 'restaurant',
      lastEventAt,
      ticketId: row._id.toHexString(),
    });

    await expect(source(row._id.toHexString())).resolves.toEqual({
      channel: 'WHATSAPP',
      contact: 'Ravi (+••••••••3210)',
      status: 'ACTIVE',
      detail: 'restaurant',
      messageCount: 0,
      lastActivityAt: lastEventAt,
      url: '',
    });
  });

  it('shows only the masked number for a nameless WhatsApp sender that has not picked a demo', async () => {
    const row = await ticket({ channel: 'WHATSAPP', requesterEmail: '' });
    await WhatsappChatModel.create({ waId: '15550001234', ticketId: row._id.toHexString() });

    await expect(source(row._id.toHexString())).resolves.toMatchObject({
      contact: '+•••••••1234',
      detail: '',
      lastActivityAt: null,
    });
  });

  it('is null when the linked conversation is gone, or the ticket is its own thread', async () => {
    const chat = await ticket({ channel: 'CHAT' });
    const whatsapp = await ticket({ channel: 'WHATSAPP' });
    const email = await ticket({ channel: 'EMAIL' });

    await expect(source(chat._id.toHexString())).resolves.toBeNull();
    await expect(source(whatsapp._id.toHexString())).resolves.toBeNull();
    await expect(source(email._id.toHexString())).resolves.toBeNull();
  });

  it('answers 404 for a malformed id and for a ticket that does not exist', async () => {
    await expect(source('not-an-id')).rejects.toThrow('SupportTicket not found');
    await expect(source(new Types.ObjectId().toHexString())).rejects.toThrow(
      'SupportTicket not found',
    );
  });

  it("keeps an IT-only agent out of another desk's ticket", async () => {
    const billing = await ticket({ channel: 'EMAIL' });
    const it = await ticket({ channel: 'EMAIL', category: 'IT' });

    await expect(source(billing._id.toHexString(), asIt)).rejects.toThrow(
      'SupportTicket not found',
    );
    await expect(source(it._id.toHexString(), asIt)).resolves.toBeNull();
  });

  it('refuses a caller who is not on a desk, or not signed in', async () => {
    const row = await ticket({ channel: 'EMAIL' });

    await expect(source(row._id.toHexString(), as([ROLES.EMPLOYEE]))).rejects.toThrow();
    await expect(source(row._id.toHexString(), { user: null })).rejects.toThrow();
  });

  it("never reaches another company's ticket", async () => {
    const theirs = new Types.ObjectId().toHexString();
    const mine = new Types.ObjectId().toHexString();
    const row = await runForOrganization(theirs, () => ticket({ channel: 'EMAIL' }));

    await expect(runForOrganization(mine, () => source(row._id.toHexString()))).rejects.toThrow(
      'SupportTicket not found',
    );
  });
});

describe('suggestSupportReply', () => {
  const suggest = (id: string, ctx: GraphQLContext = asSupport) =>
    M.suggestSupportReply(null, { ticketId: id }, ctx);

  beforeEach(async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    complete.mockResolvedValue({
      text: '  We have refunded the duplicate charge.  ',
      promptTokens: 120,
      completionTokens: 30,
      totalTokens: 150,
    });
    await OpenAiConfigModel.create({
      label: 'Primary',
      apiKey: randomUUID(),
      defaultModel: 'gpt-4o-mini',
      isActive: true,
    });
  });

  it('drafts from the thread, matching articles and canned replies, and logs the spend', async () => {
    const row = await ticket();
    const id = row._id.toHexString();
    await KbArticleModel.create({
      title: 'Refund for a duplicate invoice',
      slug: 'duplicate-invoice-refund',
      category: 'OTHER',
      summary: 'How refunds work',
      body: 'Duplicate invoice charges are refunded within 5 days.',
      isPublished: true,
    });
    await KbArticleModel.create({
      title: 'Draft about invoice refunds',
      slug: 'draft-refunds',
      category: 'OTHER',
      body: 'Not published yet: duplicate invoice refund.',
      isPublished: false,
    });
    await CannedReplyModel.create({ title: 'Refund issued', category: 'OTHER', body: 'Done.' });
    await CannedReplyModel.create({ title: 'Reset VPN', category: 'IT', body: 'Restart it.' });
    await CannedReplyModel.create({
      title: 'Retired',
      category: 'OTHER',
      body: 'Old.',
      isActive: false,
    });
    await SupportReplyModel.create({
      ticketId: id,
      authorId: 'c',
      authorName: 'Asha',
      body: 'Hi?',
    });
    await SupportReplyModel.create({
      ticketId: id,
      authorId: 'a',
      authorName: 'Agent',
      body: 'SECRET internal note',
      internal: true,
    });

    const result = await suggest(id);

    expect(result).toEqual({
      body: 'We have refunded the duplicate charge.',
      articles: [
        {
          id: expect.any(String),
          title: 'Refund for a duplicate invoice',
          slug: 'duplicate-invoice-refund',
        },
      ],
      cannedReplies: ['Refund issued'],
    });
    const prompt = sentPrompt();
    expect(prompt).toContain('Ticket: Refund for duplicate invoice');
    expect(prompt).toContain('From: Asha Rao');
    expect(prompt).toContain('Asha: Hi?');
    expect(prompt).toContain('Duplicate invoice charges are refunded within 5 days.');
    expect(prompt).toContain('## Refund issued\nDone.');
    expect(prompt).not.toContain('SECRET internal note');
    expect(prompt).not.toContain('Not published yet');
    expect(prompt).not.toContain('Reset VPN');
    const job = await AiJobModel.findOne().lean();
    expect(job).toMatchObject({
      name: 'Support suggested reply',
      status: 'SUCCEEDED',
      createdById: asSupport.user?.id,
      createdByName: 'desk@exyconn.com',
    });
  });

  it('drafts from an article saved before articles had a summary', async () => {
    await KbArticleModel.init();
    await KbArticleModel.collection.insertOne({
      title: 'Duplicate invoice refund',
      slug: 'legacy-refund',
      category: 'OTHER',
      body: 'Legacy refund steps for a duplicate invoice.',
      isPublished: true,
    });
    const row = await ticket();

    await expect(suggest(row._id.toHexString())).resolves.toMatchObject({
      articles: [{ slug: 'legacy-refund' }],
    });
    expect(sentPrompt()).toContain(
      '## Duplicate invoice refund\n\nLegacy refund steps for a duplicate invoice.',
    );
  });

  it('says plainly when there is nothing to draft from', async () => {
    const row = await ticket({ requesterName: '', subject: 'Zzqx', description: 'Wobble.' });

    const result = await suggest(row._id.toHexString());

    expect(result).toMatchObject({ articles: [], cannedReplies: [] });
    const prompt = sentPrompt();
    expect(prompt).toContain('From: the requester');
    expect(prompt).toContain('(no replies yet)');
    expect(prompt).toContain('Knowledge-base articles:\n(none matched)');
    expect(prompt).toContain('Canned replies:\n(none)');
  });

  it('still drafts, without articles, when the knowledge-base search fails', async () => {
    const warn = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(KbArticleModel, 'find').mockImplementationOnce(() => {
      throw new Error('text index missing');
    });
    const row = await ticket();

    await expect(suggest(row._id.toHexString())).resolves.toMatchObject({ articles: [] });
    expect(warn).toHaveBeenCalledWith(
      { err: expect.any(Error) },
      'Knowledge-base search for a suggested reply failed',
    );
  });

  it('uses only the canned replies of the caller desk', async () => {
    const row = await ticket({ category: 'IT' });
    await CannedReplyModel.create({ title: 'Reset VPN', category: 'IT', body: 'Restart it.' });

    await expect(suggest(row._id.toHexString(), asIt)).resolves.toMatchObject({
      cannedReplies: ['Reset VPN'],
    });
  });

  it('refuses before spending once the monthly AI budget is used up', async () => {
    await AiSpendLimitModel.create({ key: 'global', monthlyUsdCap: 1, enabled: true });
    await AiJobModel.create({
      name: 'Earlier',
      model: 'gpt-4o',
      prompt: 'x',
      status: 'SUCCEEDED',
      costUsd: 2,
      ranAt: new Date(),
    });
    const row = await ticket();

    await expect(suggest(row._id.toHexString())).rejects.toThrow(/monthly AI budget/);
    expect(complete).not.toHaveBeenCalled();
  });

  it('passes on a failed model call as an error the agent sees', async () => {
    complete.mockRejectedValueOnce(new Error('model overloaded'));
    const row = await ticket();

    await expect(suggest(row._id.toHexString())).rejects.toThrow('model overloaded');
  });

  it("refuses a ticket outside the caller's desk and a caller who is not on one", async () => {
    const row = await ticket();

    await expect(suggest(row._id.toHexString(), asIt)).rejects.toThrow('SupportTicket not found');
    await expect(suggest(row._id.toHexString(), as([ROLES.CRM]))).rejects.toThrow();
    expect(complete).not.toHaveBeenCalled();
  });
});

describe('the public satisfaction survey', () => {
  beforeEach(() => {
    send.mockResolvedValue(undefined);
  });

  it('shows the survey and takes one answer through the link, with no account', async () => {
    const row = await ticket({ reference: 'EXY-ZZ9' });
    await sendCsatSurvey(row.toObject());
    const url: string = send.mock.calls[0][0].variables.ratingUrl;
    const token = url.slice(url.lastIndexOf('/') + 1);
    const anonymous: GraphQLContext = { user: null, ip: '10.1.1.1' };

    await expect(Q.supportCsatSurvey(null, { token }, anonymous)).resolves.toMatchObject({
      reference: 'EXY-ZZ9',
      score: null,
    });
    await expect(
      M.submitSupportCsat(null, { token, score: 5, comment: null }, anonymous),
    ).resolves.toBe(true);
    await expect(
      M.submitSupportCsat(null, { token, score: 5, comment: 'again' }, anonymous),
    ).rejects.toThrow(/already been answered/);
    expect(await SupportTicketModel.findById(row._id).lean()).toMatchObject({
      csatScore: 5,
      csatComment: '',
    });
  });
});
