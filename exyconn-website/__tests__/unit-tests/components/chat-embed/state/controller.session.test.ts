// @vitest-environment jsdom
/** The chat controller: connecting, signing in, connection drops, settings and teardown. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { primeAudio } from "../../../../../src/components/chat-embed/lib/sound";
import { downloadTranscript } from "../../../../../src/components/chat-embed/lib/transcript";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { FakeSocket } from "../fake-socket";
import {
  SOUND_KEY,
  TOKEN_KEY,
  agentReply,
  resetChatEnvironment,
  startController,
  stopControllers,
} from "./controller-harness";

vi.mock("../../../../../src/components/chat-embed/lib/sound", () => ({
  primeAudio: vi.fn(),
  chime: vi.fn(),
}));
vi.mock("../../../../../src/components/chat-embed/lib/transcript", () => ({
  downloadTranscript: vi.fn(),
}));

const IDENTITY = { name: "Riya", email: "riya@example.com", phone: "" };

beforeEach(() => {
  resetChatEnvironment();
  vi.mocked(primeAudio).mockClear();
  vi.mocked(downloadTranscript).mockClear();
});

afterEach(() => {
  stopControllers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "referrer");
});

describe("connecting", () => {
  it("waits for a first-time visitor to open the chat", () => {
    const { store, actions } = startController();
    expect(FakeSocket.instances).toHaveLength(0);
    actions.open();
    expect(primeAudio).toHaveBeenCalledTimes(1);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(store.get()).toMatchObject({ open: true, unread: 0, connection: "connecting" });
    FakeSocket.latest().open();
    expect(FakeSocket.latest().sent[0]).toEqual({ t: "hello", role: "visitor", site: "WEBSITE" });
    expect(store.get().connection).toBe("open");
  });

  it("connects a returning visitor at once, greeting with the stored pass", () => {
    localStorage.setItem(TOKEN_KEY, "pass-0");
    startController();
    expect(FakeSocket.instances).toHaveLength(1);
    FakeSocket.latest().open();
    expect(FakeSocket.latest().sent[0]).toMatchObject({ t: "hello", token: "pass-0" });
  });

  it("applies server frames and keeps the pass it is given", () => {
    const { store, signIn } = startController();
    signIn();
    expect(store.get().step).toBe("signedIn");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("pass-1");
  });

  it("marks waiting replies read when a signed-in visitor opens the panel", () => {
    const { store, actions, signIn, receive, sentAfterHello } = startController();
    const socket = signIn();
    actions.close();
    receive({ t: "message", message: agentReply("r-1") });
    expect(store.get()).toMatchObject({ open: false, unread: 1 });

    actions.open();
    expect(store.get().unread).toBe(0);
    expect(sentAfterHello(socket)).toEqual([{ t: "read" }]);
    actions.open();
    expect(sentAfterHello(socket)).toEqual([{ t: "read" }]);
  });

  it("marks failed whatever was in flight when the connection drops", () => {
    const { store, actions, signIn } = startController();
    const socket = signIn();
    actions.send("LIVE", "Are you there?", []);
    actions.requestCode(IDENTITY);
    socket.drop();
    expect(store.get()).toMatchObject({ connection: "reconnecting", busy: false });
    expect(store.get().threads.LIVE[0].status).toBe("failed");
  });
});

describe("signing in", () => {
  it("says it is not connected when the socket is not open", () => {
    const { store, actions } = startController();
    actions.requestCode(IDENTITY);
    actions.verifyCode("123456");
    expect(store.get()).toMatchObject({ error: strings.notConnected, busy: false });
    expect(store.get().identity).toEqual({ name: "", email: "", phone: "" });
  });

  it("asks for a code with the page the visitor came from, and can ask again", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      get: () => "https://shop.example.com/cart",
    });
    const { store, actions, connect, sentAfterHello } = startController();
    const socket = connect();
    actions.requestCode(IDENTITY);
    expect(store.get()).toMatchObject({ identity: IDENTITY, busy: true, error: "" });
    actions.resendCode();
    const frame = { t: "requestCode", ...IDENTITY, pageUrl: "https://shop.example.com/cart" };
    expect(sentAfterHello(socket)).toEqual([frame, frame]);
  });

  it("records the host page, cut to the server's limit", () => {
    const { actions, connect, sentAfterHello } = startController();
    const socket = connect();
    actions.setPageUrl(`https://shop.example.com/${"a".repeat(600)}`);
    actions.requestCode(IDENTITY);
    const [frame] = sentAfterHello(socket) as { pageUrl: string }[];
    expect(frame.pageUrl).toHaveLength(500);
  });

  it("verifies the code with the identity it asked for", () => {
    const { store, actions, connect, sentAfterHello } = startController();
    const socket = connect();
    actions.requestCode(IDENTITY);
    store.set({ busy: false });
    actions.verifyCode("123456");
    expect(sentAfterHello(socket)[1]).toEqual({
      t: "verifyCode",
      ...IDENTITY,
      pageUrl: "",
      code: "123456",
    });
    expect(store.get().busy).toBe(true);
  });

  it("goes back to the form to change the email", () => {
    const { store, actions } = startController();
    store.set({ step: "code", error: "Wrong code" });
    actions.changeEmail();
    expect(store.get()).toMatchObject({ step: "form", error: "" });
  });
});

describe("settings and errors", () => {
  it("remembers the sound preference", () => {
    const { store, actions } = startController();
    actions.setSound(true);
    expect(localStorage.getItem(SOUND_KEY)).toBe("on");
    expect(store.get().soundOn).toBe(true);
    actions.setSound(false);
    expect(localStorage.getItem(SOUND_KEY)).toBe("off");
    expect(store.get().soundOn).toBe(false);
  });

  it("shows and dismisses an error", () => {
    const { store, actions } = startController();
    actions.showError("Microphone blocked");
    expect(store.get().error).toBe("Microphone blocked");
    actions.dismissError();
    expect(store.get().error).toBe("");
  });

  it("downloads the transcript only once there is a session", () => {
    const { store, actions, signIn } = startController();
    actions.download();
    expect(downloadTranscript).not.toHaveBeenCalled();
    signIn();
    actions.download();
    expect(downloadTranscript).toHaveBeenCalledWith(store.get().session, store.get().threads);
  });
});

describe("dispose", () => {
  it("closes the socket for good", () => {
    vi.useFakeTimers();
    const { dispose, signIn } = startController();
    const socket = signIn();
    dispose();
    expect(socket.closeCalls).toBe(1);
    vi.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(1);
    vi.useRealTimers();
  });
});
