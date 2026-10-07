import { Types } from 'mongoose';
import type { WebSocket } from 'ws';
import { OrganizationModel } from '../../../../src/modules/organizations';
import { invalidatePlatformOperatorCache } from '../../../../src/lib/platformAccess';
import { runAsPlatform, setDefaultScope } from '../../../../src/lib/tenant';
import { ChatSessionModel } from '../../../../src/modules/website-chat/models';
import type { ChatPeer } from '../../../../src/modules/website-chat/chat.hub';

/**
 * Runs the suite inside the platform operator's company — the one the website chat belongs
 * to — so data a test writes is what `asChatOwner` reads. The harness empties every
 * collection after each test, so the company is written again before every one.
 */
export function useChatOperator(): string {
  const organizationId = new Types.ObjectId();
  setDefaultScope({ organizationId: String(organizationId), platform: false });
  beforeEach(async () => {
    invalidatePlatformOperatorCache();
    await runAsPlatform(() =>
      OrganizationModel.create({
        _id: organizationId,
        name: 'Exyconn',
        slug: 'exyconn',
        currency: 'USD',
        isPlatformOperator: true,
      }),
    );
  });
  return String(organizationId);
}

export interface FakeSocket {
  readyState: number;
  OPEN: number;
  send: jest.Mock;
  close: jest.Mock;
  ping: jest.Mock;
  terminate: jest.Mock;
}

/** An open socket that records what it was sent. */
export function fakeSocket(readyState = 1): FakeSocket {
  return {
    readyState,
    OPEN: 1,
    send: jest.fn(),
    close: jest.fn(),
    ping: jest.fn(),
    terminate: jest.fn(),
  };
}

/** A chat peer on a fake socket; the socket is returned with it to read frames back. */
export function fakePeer(overrides: Partial<ChatPeer> = {}, readyState = 1) {
  const socket = fakeSocket(readyState);
  const peer: ChatPeer = {
    socket: socket as unknown as WebSocket,
    ip: '203.0.113.7',
    role: null,
    site: 'WEBSITE',
    sessionId: null,
    watching: null,
    token: '',
    alive: true,
    ...overrides,
  };
  return { peer, socket };
}

/** Every frame a fake socket was sent, parsed. */
export function framesOf(socket: FakeSocket): Array<Record<string, unknown>> {
  return socket.send.mock.calls.map(([raw]) => JSON.parse(String(raw)) as Record<string, unknown>);
}

/** Waits (up to about two seconds) for fire-and-forget work to reach `done`. */
export async function until(done: () => boolean | Promise<boolean>): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await done()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** A stored chat session with sensible defaults. */
export function createSession(fields: Record<string, unknown> = {}) {
  return ChatSessionModel.create({
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    site: 'WEBSITE',
    ticketReference: 'TCK-1',
    ...fields,
  });
}

/** An id-shaped value for schema checks. */
export const CHAT_AGENT_ID = '64b7f0c2a1b2c3d4e5f60718';

/** Valid Website > Chatbot > Settings, as the form sends them. */
export const validSettings = () => ({
  enabled: true,
  botName: 'Exyconn Assistant',
  welcomeMessage: 'Hello there',
  offlineMessage: 'We are away',
  handoffMessage: 'The bot has it',
  refusalMessage: 'Only Exyconn',
  customInstructions: '',
  timezone: 'Asia/Kolkata',
  weeklyHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    enabled: day > 0 && day < 6,
    start: '09:00',
    end: '18:00',
  })),
  noReplyTimeoutSeconds: 120,
  botModel: 'gpt-4o',
  maxContextChars: 12000,
  allowUploads: true,
  maxUploadMb: 10,
  soundEnabledByDefault: true,
  transcriptOnClose: true,
  sessionTimeoutMinutes: 10,
  embeddingModel: 'text-embedding-3-small',
  agentIds: [CHAT_AGENT_ID],
  slackEnabled: false,
});
