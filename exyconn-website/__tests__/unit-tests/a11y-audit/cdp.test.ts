/**
 * The DevTools driver against a stand-in Chrome: it waits for the DevTools port file, speaks
 * the protocol over the socket (replies matched by id, errors rejected, events routed by
 * session), runs page setup only when given, and cleans up the profile on close.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const child = vi.hoisted(() => ({ kill: vi.fn(), spawn: vi.fn() }));
const fs = vi.hoisted(() => ({ mkdtemp: vi.fn(), readFile: vi.fn(), rm: vi.fn() }));
vi.mock("node:child_process", () => ({ spawn: child.spawn }));
vi.mock("node:fs/promises", () => fs);
vi.mock("node:os", () => ({ tmpdir: () => "/tmp" }));
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn(async () => undefined) }));

import { launchBrowser } from "../../../scripts/a11y-audit/cdp.mjs";

interface Sent {
  id: number;
  method: string;
  params: Record<string, unknown>;
  sessionId?: string;
}

/** Replies the way Chrome would to the commands the driver sends. */
function reply(message: Sent): Record<string, unknown> {
  switch (message.method) {
    case "Target.createTarget":
      return { result: { targetId: "target-1" } };
    case "Target.attachToTarget":
      return { result: { sessionId: "session-1" } };
    case "Bad.method":
      return { error: { message: "'Bad.method' wasn't found" } };
    case "Runtime.evaluate":
      return { result: evaluation(String(message.params.expression)) };
    default:
      return { result: {} };
  }
}

function evaluation(expression: string) {
  if (expression === "throw") {
    return { result: {}, exceptionDetails: { exception: { description: "Error: boom" } } };
  }
  if (expression === "syntax") {
    return { result: {}, exceptionDetails: { text: "Uncaught SyntaxError" } };
  }
  return { result: { value: `value of ${expression}` } };
}

class FakeSocket extends EventTarget {
  static last: FakeSocket;
  static failOpen = false;
  readonly sent: Sent[] = [];
  closed = false;

  constructor(readonly url: string) {
    super();
    FakeSocket.last = this;
    queueMicrotask(() => this.dispatchEvent(new Event(FakeSocket.failOpen ? "error" : "open")));
  }

  send(raw: string) {
    const message = JSON.parse(raw) as Sent;
    this.sent.push(message);
    queueMicrotask(() => {
      this.emit({ id: message.id, ...reply(message) });
      if (message.method === "Page.navigate") {
        this.emit({ method: "Page.loadEventFired", sessionId: "other-session", params: {} });
        this.emit({ method: "Page.frameNavigated", sessionId: message.sessionId, params: {} });
        this.emit({ method: "Page.loadEventFired", sessionId: message.sessionId, params: {} });
      }
    });
  }

  emit(message: Record<string, unknown>) {
    this.dispatchEvent(Object.assign(new Event("message"), { data: JSON.stringify(message) }));
  }

  close() {
    this.closed = true;
  }
}

beforeEach(() => {
  FakeSocket.failOpen = false;
  vi.stubGlobal("WebSocket", FakeSocket);
  child.spawn.mockReturnValue({ kill: child.kill });
  fs.mkdtemp.mockResolvedValue("/tmp/a11y-audit-x");
  fs.readFile
    .mockRejectedValueOnce(new Error("ENOENT"))
    .mockResolvedValue("9222\n/devtools/browser/abc");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  fs.readFile.mockReset();
});

describe("launchBrowser", () => {
  it("starts headless Chrome on a throwaway profile and connects to its DevTools port", async () => {
    vi.stubEnv("CHROME_PATH", "/usr/bin/chrome");
    await launchBrowser();
    expect(fs.mkdtemp).toHaveBeenCalledWith("/tmp/a11y-audit-");
    expect(child.spawn).toHaveBeenCalledWith(
      "/usr/bin/chrome",
      [
        "--headless=new",
        "--remote-debugging-port=0",
        "--user-data-dir=/tmp/a11y-audit-x",
        "--no-first-run",
      ],
      { stdio: "ignore" }
    );
    expect(fs.readFile).toHaveBeenCalledWith("/tmp/a11y-audit-x/DevToolsActivePort", "utf8");
    expect(FakeSocket.last.url).toBe("ws://127.0.0.1:9222/devtools/browser/abc");
  });

  it("uses the macOS Chrome when CHROME_PATH is not set", async () => {
    vi.stubEnv("CHROME_PATH", undefined);
    await launchBrowser();
    expect(child.spawn.mock.calls[0][0]).toBe(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    );
  });

  it("gives up when Chrome never writes its DevTools port", async () => {
    fs.readFile.mockReset().mockRejectedValue(new Error("ENOENT"));
    await expect(launchBrowser()).rejects.toThrow("set CHROME_PATH to a Chrome binary");
    expect(fs.readFile).toHaveBeenCalledTimes(100);
  });

  it("fails when the DevTools socket cannot connect", async () => {
    FakeSocket.failOpen = true;
    await expect(launchBrowser()).rejects.toBeInstanceOf(Event);
  });

  it("closes the socket, stops Chrome and removes the profile", async () => {
    const browser = await launchBrowser();
    await browser.close();
    expect(FakeSocket.last.closed).toBe(true);
    expect(child.kill).toHaveBeenCalledTimes(1);
    expect(fs.rm).toHaveBeenCalledWith("/tmp/a11y-audit-x", { recursive: true, force: true });
  });
});

describe("openPage", () => {
  it("opens a blank tab, attaches to it and installs the setup script", async () => {
    const browser = await launchBrowser();
    await browser.openPage("setup()");
    const sent = FakeSocket.last.sent;
    expect(sent.map(({ method }) => method)).toEqual([
      "Target.createTarget",
      "Target.attachToTarget",
      "Page.enable",
      "Runtime.enable",
      "Page.addScriptToEvaluateOnNewDocument",
    ]);
    expect(sent[0].params).toEqual({ url: "about:blank" });
    expect(sent[1].params).toEqual({ targetId: "target-1", flatten: true });
    expect(sent[2]).toMatchObject({ sessionId: "session-1", params: {} });
    expect(sent[4].params).toEqual({ source: "setup()" });
    expect(sent.map(({ id }) => id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("installs no script without setup", async () => {
    const browser = await launchBrowser();
    await browser.openPage();
    expect(FakeSocket.last.sent.map(({ method }) => method)).not.toContain(
      "Page.addScriptToEvaluateOnNewDocument"
    );
  });

  it("evaluates an expression and returns its value", async () => {
    const page = await (await launchBrowser()).openPage();
    expect(await page.evaluate("1 + 1")).toBe("value of 1 + 1");
    expect(FakeSocket.last.sent.at(-1)).toMatchObject({
      method: "Runtime.evaluate",
      params: { expression: "1 + 1", awaitPromise: true, returnByValue: true },
      sessionId: "session-1",
    });
  });

  it("throws the page's exception, or its text when there is no exception", async () => {
    const page = await (await launchBrowser()).openPage();
    await expect(page.evaluate("throw")).rejects.toThrow("Error: boom");
    await expect(page.evaluate("syntax")).rejects.toThrow("Uncaught SyntaxError");
  });

  it("rejects a command Chrome answers with an error", async () => {
    const page = await (await launchBrowser()).openPage();
    await expect(page.call("Bad.method", {})).rejects.toThrow("'Bad.method' wasn't found");
  });

  it("navigates and waits for this tab's load event", async () => {
    const page = await (await launchBrowser()).openPage();
    await page.goto("http://site/en-us");
    expect(FakeSocket.last.sent.at(-1)).toMatchObject({
      method: "Page.navigate",
      params: { url: "http://site/en-us" },
      sessionId: "session-1",
    });
  });

  it("closes its own tab", async () => {
    const page = await (await launchBrowser()).openPage();
    await page.close();
    expect(FakeSocket.last.sent.at(-1)).toMatchObject({
      method: "Target.closeTarget",
      params: { targetId: "target-1" },
    });
    expect(FakeSocket.last.sent.at(-1)?.sessionId).toBeUndefined();
  });
});
