import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  agentReply,
  chatAgentFor,
  chatAgentForToken,
  claimSession,
} from '../../../../src/modules/website-chat/chat.staff';
import { relayToSlack } from '../../../../src/modules/website-chat/chat.slack';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { ChatMessageModel, ChatSessionModel } from '../../../../src/modules/website-chat/models';
import { buildContext, type GraphQLContext } from '../../../../src/middleware/auth';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { imageUploader } from '../../../../src/utils/imagekit';
import type { Role } from '../../../../src/constants/roles';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { codeOf } from '../codeOf';
import { createSession, fakePeer, framesOf, useChatOperator } from './chat.fixtures';

jest.mock('../../../../src/middleware/auth', () => ({
  ...jest.requireActual('../../../../src/middleware/auth'),
  buildContext: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.slack', () => ({ relayToSlack: jest.fn() }));
jest.mock('../../../../src/utils/imagekit', () => ({
  imageUploader: { uploadChatMedia: jest.fn() },
}));

const operatorId = useChatOperator();
const agent = { id: 'u-sam', name: 'Sam' };

const ctxFor = (
  roles: Role[],
  organizationId: string | null,
  id = new Types.ObjectId().toHexString(),
) =>
  ({
    user: { id, email: 'sam@exyconn.test', roles, organizationId },
    organizationId,
  }) as GraphQLContext;

afterEach(() => {
  for (const peer of chatHub.all()) {
    chatHub.leave(peer);
  }
});

describe('chatAgentFor', () => {
  it("names a website team member of the operator's company", async () => {
    const user = await UserModel.create({
      name: 'Sam Agent',
      email: 'sam@exyconn.test',
      passwordHash: randomUUID(),
      roles: ['WEBSITE'],
    });
    const ctx = ctxFor(['WEBSITE'], operatorId, user._id.toHexString());
    await expect(chatAgentFor(ctx, 'EDIT')).resolves.toEqual({
      id: user._id.toHexString(),
      name: 'Sam Agent',
    });
  });

  it('lets a platform administrator in, named by their email when they have no account here', async () => {
    const ctx = ctxFor(['SUPER_ADMIN'], null);
    await expect(runAsPlatform(() => chatAgentFor(ctx, 'DELETE'))).resolves.toMatchObject({
      name: 'sam@exyconn.test',
    });
  });

  it('refuses anyone outside the operator, without the role, or signed out', async () => {
    expect(
      await codeOf(chatAgentFor(ctxFor(['WEBSITE'], new Types.ObjectId().toHexString()), 'VIEW')),
    ).toBe('FORBIDDEN');
    expect(await codeOf(chatAgentFor(ctxFor(['EMPLOYEE'], operatorId), 'VIEW'))).toBe('FORBIDDEN');
    expect(await codeOf(chatAgentFor({} as GraphQLContext, 'VIEW'))).toBe('UNAUTHENTICATED');
  });
});

describe('chatAgentForToken', () => {
  it("checks the socket's token exactly as a request's would be", async () => {
    (buildContext as jest.Mock).mockResolvedValue(ctxFor(['WEBSITE'], operatorId));
    await expect(chatAgentForToken('portal-token', '203.0.113.9', 'VIEW')).resolves.toMatchObject({
      name: 'sam@exyconn.test',
    });
    expect(buildContext).toHaveBeenCalledWith({
      req: { headers: { authorization: 'Bearer portal-token' }, ip: '203.0.113.9', query: {} },
    });
  });

  it('refuses a token that signs nobody in', async () => {
    (buildContext as jest.Mock).mockResolvedValue({});
    expect(await codeOf(chatAgentForToken('stale', '203.0.113.9', 'VIEW'))).toBe('UNAUTHENTICATED');
  });
});

describe('claimSession', () => {
  it('takes the chat and tells the consoles', async () => {
    const session = await createSession();
    const staff = fakePeer({ role: 'staff' });
    chatHub.join(staff.peer);
    const claimed = await claimSession(session._id.toHexString(), agent);
    expect(claimed).toMatchObject({ assigneeId: 'u-sam', assigneeName: 'Sam' });
    expect(framesOf(staff.socket)[0]).toMatchObject({
      t: 'session',
      session: { assigneeName: 'Sam' },
    });
  });

  it('refuses a chat that does not exist', async () => {
    expect(await codeOf(claimSession(new Types.ObjectId().toHexString(), agent))).toBe('NOT_FOUND');
  });
});

describe('agentReply', () => {
  it('posts the reply, takes an unassigned chat, relays it to Slack and marks the chat read', async () => {
    (imageUploader.uploadChatMedia as jest.Mock).mockResolvedValue('https://ik.test/p.png');
    const session = await createSession({
      staffUnread: 3,
      slackChannel: 'D1',
      slackThreadTs: '9.9',
    });
    const sessionId = session._id.toHexString();
    const visitor = fakePeer({ role: 'visitor', sessionId });
    chatHub.join(visitor.peer);
    const file = { name: 'p.png', data: 'data:image/png;base64,AAAA' };

    await agentReply(sessionId, agent, 'Hi Dana', [file], 'c-7');

    const saved = await ChatSessionModel.findById(sessionId).lean();
    expect(saved).toMatchObject({ assigneeId: 'u-sam', assigneeName: 'Sam', staffUnread: 0 });
    const line = await ChatMessageModel.findOne({ sender: 'AGENT' }).lean();
    expect(line).toMatchObject({
      senderName: 'Sam',
      senderId: 'u-sam',
      body: 'Hi Dana',
      channel: 'LIVE',
    });
    expect(line?.attachments).toEqual([
      { url: 'https://ik.test/p.png', name: 'p.png', kind: 'IMAGE', size: 3 },
    ]);
    expect(framesOf(visitor.socket).find((frame) => frame.t === 'message')).toMatchObject({
      clientId: 'c-7',
    });
    expect(relayToSlack).toHaveBeenCalledWith(
      expect.objectContaining({ slackChannel: 'D1', slackThreadTs: '9.9' }),
      'Sam (portal)',
      'Hi Dana',
      [expect.objectContaining({ kind: 'IMAGE' })],
    );
  });

  it('leaves the chat with whoever already has it', async () => {
    const session = await createSession({ assigneeId: 'u-ann', assigneeName: 'Ann' });
    await agentReply(session._id.toHexString(), agent, 'Covering for Ann', [], 'c-8');
    expect((await ChatSessionModel.findById(session._id).lean())?.assigneeName).toBe('Ann');
  });

  it('refuses a missing chat, an ended chat and an empty reply', async () => {
    const reply = (id: string, body = 'Hi') => agentReply(id, agent, body, [], 'c');
    expect(await codeOf(reply(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
    const closed = await createSession({ status: 'CLOSED' });
    await expect(reply(closed._id.toHexString())).rejects.toThrow('This chat has ended.');
    const open = await createSession();
    await expect(reply(open._id.toHexString(), '')).rejects.toThrow(
      'Write a message or attach a file.',
    );
    expect(await ChatMessageModel.countDocuments()).toBe(0);
  });
});
