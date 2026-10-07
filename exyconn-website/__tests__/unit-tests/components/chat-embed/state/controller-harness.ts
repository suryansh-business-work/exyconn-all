/**
 * Shared set-up for the chat controller tests: a fake WebSocket, a fresh localStorage, and a
 * controller whose socket can be opened and fed frames. For jsdom test files.
 */
import { vi } from "vitest";
import {
  createChatController,
  type ChatController,
} from "../../../../../src/components/chat-embed/state/controller";
import type { ServerFrame } from "../../../../../src/components/chat-embed/types";
import { makeMessage, makeSession } from "../chat-fixtures";
import { FakeSocket } from "../fake-socket";

export const SOCKET_URL = "wss://portal.example.test/chat/ws";
export const TOKEN_KEY = "exyconn-chat:WEBSITE:token";
export const SOUND_KEY = "exyconn-chat:WEBSITE:sound";

const started: ChatController[] = [];

/** Disposes every controller a test started, so no reconnect timer outlives its test. */
export function stopControllers(): void {
  started.splice(0).forEach((controller) => controller.dispose());
}

export function resetChatEnvironment(): void {
  FakeSocket.reset();
  vi.stubGlobal("WebSocket", FakeSocket);
  localStorage.clear();
}

/** A controller, and helpers to open its socket and play server frames into it. */
export function startController() {
  const controller = createChatController(SOCKET_URL, "WEBSITE");
  started.push(controller);
  const connect = (): FakeSocket => {
    controller.actions.open();
    const socket = FakeSocket.latest();
    socket.open();
    return socket;
  };
  const receive = (frame: ServerFrame): void => FakeSocket.latest().receive(frame);
  const signIn = (status: "OPEN" | "CLOSED" = "OPEN"): FakeSocket => {
    const socket = connect();
    receive({ t: "signedIn", token: "pass-1", session: makeSession({ status }), messages: [] });
    return socket;
  };
  /** Frames the controller sent after the hello. */
  const sentAfterHello = (socket: FakeSocket) => socket.sent.slice(1);
  return { controller, ...controller, connect, receive, signIn, sentAfterHello };
}

export const agentReply = (id: string) => makeMessage({ id, sender: "AGENT", senderName: "Sam" });
