import {
  greetStaff,
  handleStaffFrame,
} from '../../../../src/modules/website-chat/chat.socket.staff';
import { agentReply, chatAgentForToken } from '../../../../src/modules/website-chat/chat.staff';
import { markReadByStaff } from '../../../../src/modules/website-chat/chat.messages';
import { chatHub } from '../../../../src/modules/website-chat/chat.hub';
import { codeOf } from '../codeOf';
import { CHAT_AGENT_ID, fakePeer, framesOf } from './chat.fixtures';

jest.mock('../../../../src/modules/website-chat/chat.staff', () => ({
  agentReply: jest.fn(),
  chatAgentForToken: jest.fn(),
}));
jest.mock('../../../../src/modules/website-chat/chat.messages', () => ({
  markReadByStaff: jest.fn(),
}));

const checkToken = chatAgentForToken as jest.Mock;
const SESSION = CHAT_AGENT_ID;

function signedInStaff() {
  const entry = fakePeer({ role: 'staff', token: 'portal-token' });
  chatHub.join(entry.peer);
  return entry;
}

beforeEach(() => {
  checkToken.mockResolvedValue({ id: 'u1', name: 'Sam' });
});
afterEach(() => {
  for (const peer of [...chatHub.all()]) {
    chatHub.leave(peer);
  }
});

describe('greetStaff', () => {
  it('signs the console in once the token carries chat access', async () => {
    const { peer, socket } = fakePeer();
    await greetStaff(peer, 'portal-token');
    expect(checkToken).toHaveBeenCalledWith('portal-token', '203.0.113.7', 'VIEW');
    expect(peer).toMatchObject({ role: 'staff', token: 'portal-token' });
    expect(framesOf(socket)).toEqual([{ t: 'ready' }]);
  });

  it('leaves the console signed out when the token is refused', async () => {
    checkToken.mockRejectedValue(new Error('denied'));
    const { peer, socket } = fakePeer();
    await expect(greetStaff(peer, 'bad')).rejects.toThrow('denied');
    expect(peer.role).toBeNull();
    expect(socket.send).not.toHaveBeenCalled();
  });
});

describe('handleStaffFrame', () => {
  it('watches a session, and stops watching', async () => {
    const { peer } = signedInStaff();
    await handleStaffFrame(peer, { t: 'watch', sessionId: SESSION });
    expect(peer.watching).toBe(SESSION);
    await handleStaffFrame(peer, { t: 'watch', sessionId: null });
    expect(peer.watching).toBeNull();
    expect(checkToken).toHaveBeenCalledWith('portal-token', '203.0.113.7', 'VIEW');
  });

  it('sends a reply as the signed-in agent, checked for edit access', async () => {
    const { peer } = signedInStaff();
    const files = [{ name: 'a.png', data: 'data:image/png;base64,AAAA' }];
    await handleStaffFrame(peer, {
      t: 'send',
      sessionId: SESSION,
      clientId: 'c1',
      body: ' Hi ',
      files,
    });
    expect(checkToken).toHaveBeenCalledWith('portal-token', '203.0.113.7', 'EDIT');
    expect(agentReply).toHaveBeenCalledWith(SESSION, { id: 'u1', name: 'Sam' }, 'Hi', files, 'c1');
  });

  it("shows the visitor the agent's typing", async () => {
    const { peer } = signedInStaff();
    const visitor = fakePeer({ role: 'visitor', sessionId: SESSION });
    chatHub.join(visitor.peer);
    await handleStaffFrame(peer, { t: 'typing', sessionId: SESSION, on: true });
    expect(framesOf(visitor.socket)).toEqual([
      { t: 'typing', who: 'AGENT', name: 'Sam', channel: 'LIVE', on: true },
    ]);
  });

  it('marks a session read and answers pings', async () => {
    const { peer, socket } = signedInStaff();
    await handleStaffFrame(peer, { t: 'read', sessionId: SESSION });
    expect(markReadByStaff).toHaveBeenCalledWith(SESSION);
    await handleStaffFrame(peer, { t: 'ping' });
    expect(framesOf(socket)).toEqual([{ t: 'pong' }]);
  });

  it('stops at the next action once access is gone', async () => {
    const { peer } = signedInStaff();
    checkToken.mockRejectedValue(new Error('signed out'));
    await expect(handleStaffFrame(peer, { t: 'read', sessionId: SESSION })).rejects.toThrow(
      'signed out',
    );
    expect(markReadByStaff).not.toHaveBeenCalled();
  });

  it('refuses a frame it does not understand', async () => {
    const { peer } = signedInStaff();
    expect(await codeOf(handleStaffFrame(peer, { t: 'delete', sessionId: SESSION }))).toBe(
      'BAD_USER_INPUT',
    );
  });
});
