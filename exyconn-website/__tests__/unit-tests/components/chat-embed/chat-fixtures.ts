/**
 * Builders for the chat embed's component tests: a widget config, a visitor session, thread
 * items and a full ChatState, each with sensible defaults a test overrides field by field, and
 * a ChatActions object whose every action is a spy.
 */
import { vi, type Mock } from "vitest";
import type { ChatActions } from "../../../../src/components/chat-embed/state/controller";
import {
  initialState,
  type ChatState,
  type ThreadItem,
} from "../../../../src/components/chat-embed/state/state";
import type {
  ChatMessage,
  VisitorSession,
  WidgetConfig,
} from "../../../../src/components/chat-embed/types";

export function makeConfig(overrides: Partial<WidgetConfig> = {}): WidgetConfig {
  return {
    enabled: true,
    botName: "Exy",
    welcomeMessage: "Hello! How can we help?",
    offlineMessage: "We are away right now.",
    online: true,
    timezone: "UTC",
    weeklyHours: [],
    allowUploads: true,
    maxUploadMb: 5,
    soundEnabledByDefault: false,
    faqs: [],
    ...overrides,
  };
}

export function makeSession(overrides: Partial<VisitorSession> = {}): VisitorSession {
  return {
    id: "session-1",
    name: "Riya",
    email: "riya@example.com",
    phone: "",
    status: "OPEN",
    ticketReference: "WC-1001",
    agentName: "",
    expiresAt: null,
    createdAt: new Date().toISOString(),
    closedAt: null,
    ...overrides,
  };
}

export function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m-1",
    sessionId: "session-1",
    channel: "LIVE",
    sender: "VISITOR",
    senderName: "Riya",
    body: "Hi there",
    attachments: [],
    sources: [],
    suggestions: [],
    feedback: null,
    createdAt: new Date().toISOString(),
    readAt: null,
    ...overrides,
  };
}

/** A sent thread item keyed by its message id. */
export function makeItem(
  message: Partial<ChatMessage> = {},
  overrides: Partial<Omit<ThreadItem, "message">> = {}
): ThreadItem {
  const built = makeMessage(message);
  return { key: built.id, message: built, status: "sent", files: [], ...overrides };
}

export function makeState(overrides: Partial<ChatState> = {}): ChatState {
  return { ...initialState(false), ...overrides };
}

/** A signed-in state with an open session and a config. */
export function signedInState(overrides: Partial<ChatState> = {}): ChatState {
  return makeState({
    open: true,
    connection: "open",
    config: makeConfig(),
    step: "signedIn",
    session: makeSession(),
    ...overrides,
  });
}

export type MockActions = { [K in keyof ChatActions]: Mock<ChatActions[K]> };

export function makeActions(): MockActions {
  return {
    open: vi.fn(),
    close: vi.fn(),
    requestCode: vi.fn(),
    resendCode: vi.fn(),
    verifyCode: vi.fn(),
    changeEmail: vi.fn(),
    send: vi.fn(),
    retry: vi.fn(),
    discard: vi.fn(),
    typed: vi.fn(),
    stopTyping: vi.fn(),
    rate: vi.fn(),
    endChat: vi.fn(),
    newChat: vi.fn(),
    setSound: vi.fn(),
    showError: vi.fn(),
    dismissError: vi.fn(),
    download: vi.fn(),
    setPageUrl: vi.fn(),
  };
}
