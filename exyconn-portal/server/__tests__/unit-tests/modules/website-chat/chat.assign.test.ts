import { randomUUID } from 'node:crypto';
import {
  agentLoads,
  assignFreeAgent,
  freestAgent,
  type ChatAgentLoad,
} from '../../../../src/modules/website-chat/chat.assign';
import { notifyAgentOnSlack } from '../../../../src/modules/website-chat/chat.slack';
import { ChatSessionModel, ChatSettingsModel } from '../../../../src/modules/website-chat/models';
import { UserModel } from '../../../../src/modules/admin/user.model';
import { logger } from '../../../../src/utils/logger';
import { createSession } from './chat.fixtures';

jest.mock('../../../../src/modules/website-chat/chat.slack', () => ({
  notifyAgentOnSlack: jest.fn(),
}));

const notify = notifyAgentOnSlack as jest.Mock;

const user = (name: string, fields: Record<string, unknown> = {}) =>
  UserModel.create({
    name,
    email: `${name.toLowerCase()}@exyconn.test`,
    passwordHash: randomUUID(),
    roles: ['WEBSITE'],
    ...fields,
  });

const load = (id: string, fields: Partial<ChatAgentLoad> = {}): ChatAgentLoad => ({
  id,
  name: id,
  email: `${id}@exyconn.test`,
  online: false,
  openChats: 0,
  lastAssignedAt: null,
  ...fields,
});

afterEach(() => jest.restoreAllMocks());

describe('agentLoads', () => {
  it('is empty when no agents are listed', async () => {
    await expect(agentLoads([])).resolves.toEqual([]);
  });

  it('counts the open chats of every agent who can still sign in', async () => {
    const online = await user('Olive', { lastActiveAt: new Date() });
    const offline = await user('Otto');
    const blocked = await user('Bea', { isBlocked: true });
    const inactive = await user('Ian', { isActive: false });
    const assignedAt = new Date('2026-10-05T09:00:00Z');
    await createSession({ assigneeId: online._id.toHexString(), assignedAt });
    await createSession({
      assigneeId: online._id.toHexString(),
      assignedAt: new Date('2026-10-01'),
    });
    await createSession({ assigneeId: online._id.toHexString(), status: 'CLOSED' });

    const loads = await agentLoads(
      [online, offline, blocked, inactive].map((agent) => agent._id.toHexString()),
    );
    const byName = new Map(loads.map((entry) => [entry.name, entry]));
    expect([...byName.keys()].sort((a, b) => a.localeCompare(b))).toEqual(['Olive', 'Otto']);
    expect(byName.get('Olive')).toEqual({
      id: online._id.toHexString(),
      name: 'Olive',
      email: 'olive@exyconn.test',
      online: true,
      openChats: 2,
      lastAssignedAt: assignedAt,
    });
    expect(byName.get('Otto')).toMatchObject({ online: false, openChats: 0, lastAssignedAt: null });
  });
});

describe('freestAgent', () => {
  it('prefers online agents, then the fewest open chats, then the longest idle', () => {
    const early = new Date('2026-10-01T00:00:00Z');
    const late = new Date('2026-10-05T00:00:00Z');
    expect(freestAgent([load('off'), load('on', { online: true, openChats: 5 })])?.id).toBe('on');
    expect(freestAgent([load('on', { online: true, openChats: 5 }), load('off')])?.id).toBe('on');
    expect(freestAgent([load('busy', { openChats: 3 }), load('free', { openChats: 1 })])?.id).toBe(
      'free',
    );
    expect(
      freestAgent([
        load('recent', { lastAssignedAt: late }),
        load('idle', { lastAssignedAt: early }),
      ])?.id,
    ).toBe('idle');
    expect(freestAgent([load('given', { lastAssignedAt: early }), load('never')])?.id).toBe(
      'never',
    );
  });

  it('is null with nobody to choose from', () => {
    expect(freestAgent([])).toBeNull();
  });
});

describe('assignFreeAgent', () => {
  it('leaves the chat unassigned when no agents are listed', async () => {
    const session = await createSession();
    await assignFreeAgent(session._id.toHexString());
    expect((await ChatSessionModel.findById(session._id).lean())?.assigneeId).toBe('');
  });

  it('gives the chat to the freest agent without Slack when Slack is off', async () => {
    const agent = await user('Olive', { lastActiveAt: new Date() });
    await ChatSettingsModel.create({ agentIds: [agent._id.toHexString()] });
    const session = await createSession();
    await assignFreeAgent(session._id.toHexString());
    const saved = await ChatSessionModel.findById(session._id).lean();
    expect(saved).toMatchObject({ assigneeId: agent._id.toHexString(), assigneeName: 'Olive' });
    expect(saved?.assignedAt).toBeInstanceOf(Date);
    expect(notify).not.toHaveBeenCalled();
  });

  it("opens the agent's Slack thread when Slack is on, logging a failure", async () => {
    const agent = await user('Olive');
    await ChatSettingsModel.create({ agentIds: [agent._id.toHexString()], slackEnabled: true });
    const session = await createSession();
    notify.mockRejectedValueOnce(new Error('Slack down'));
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await assignFreeAgent(session._id.toHexString());

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ assigneeName: 'Olive' }),
      expect.objectContaining({ id: agent._id.toHexString(), email: 'olive@exyconn.test' }),
    );
    await new Promise((resolve) => setImmediate(resolve));
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Website chat Slack notification failed',
    );
  });

  it('does not take a chat somebody already has', async () => {
    const agent = await user('Olive');
    await ChatSettingsModel.create({ agentIds: [agent._id.toHexString()], slackEnabled: true });
    const session = await createSession({ assigneeId: 'someone', assigneeName: 'Sam' });
    await assignFreeAgent(session._id.toHexString());
    expect((await ChatSessionModel.findById(session._id).lean())?.assigneeName).toBe('Sam');
    expect(notify).not.toHaveBeenCalled();
  });
});
