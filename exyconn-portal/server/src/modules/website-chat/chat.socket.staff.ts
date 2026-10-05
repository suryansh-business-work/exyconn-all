import { chatHub, type ChatPeer } from './chat.hub';
import { markReadByStaff } from './chat.messages';
import { agentReply, chatAgentForToken } from './chat.staff';
import { parseInput, staffFrameSchema } from './chat.validation';

/** A team member's console signing in: the token must carry Website > Chatbot access. */
export async function greetStaff(peer: ChatPeer, token: string): Promise<void> {
  await chatAgentForToken(token, peer.ip, 'VIEW');
  peer.role = 'staff';
  peer.token = token;
  chatHub.send(peer, { t: 'ready' });
}

/**
 * Handles one frame from a console. The token is checked again for every action, so a person
 * signed out or stripped of access mid-conversation stops at their next message.
 */
export async function handleStaffFrame(peer: ChatPeer, raw: unknown): Promise<void> {
  const frame = parseInput(staffFrameSchema, raw);
  switch (frame.t) {
    case 'watch':
      await chatAgentForToken(peer.token, peer.ip, 'VIEW');
      peer.watching = frame.sessionId;
      return;
    case 'send': {
      const agent = await chatAgentForToken(peer.token, peer.ip, 'EDIT');
      await agentReply(frame.sessionId, agent, frame.body, frame.files, frame.clientId);
      return;
    }
    case 'typing': {
      const agent = await chatAgentForToken(peer.token, peer.ip, 'EDIT');
      chatHub.toVisitors(frame.sessionId, {
        t: 'typing',
        who: 'AGENT',
        name: agent.name,
        on: frame.on,
      });
      return;
    }
    case 'read':
      await chatAgentForToken(peer.token, peer.ip, 'VIEW');
      await markReadByStaff(frame.sessionId);
      return;
    case 'ping':
      chatHub.send(peer, { t: 'pong' });
  }
}
