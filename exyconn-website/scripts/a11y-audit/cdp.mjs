/**
 * A minimal Chrome DevTools Protocol driver: launch headless Chrome, open a tab, send
 * commands. The website has no Playwright/Puppeteer dependency, and this is all the audit
 * needs — Node's built-in WebSocket speaks the protocol directly.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function readDevToolsPort(profileDir) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const [port, path] = (await readFile(join(profileDir, "DevToolsActivePort"), "utf8")).split(
        "\n"
      );
      return `ws://127.0.0.1:${port}${path}`;
    } catch {
      await delay(100);
    }
  }
  throw new Error("Chrome did not open a DevTools port — set CHROME_PATH to a Chrome binary.");
}

/** Launches Chrome and returns `{ openPage, close }`. */
export async function launchBrowser() {
  const profileDir = await mkdtemp(join(tmpdir(), "a11y-audit-"));
  const chrome = spawn(
    process.env.CHROME_PATH ?? DEFAULT_CHROME,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profileDir}`,
      "--no-first-run",
    ],
    { stdio: "ignore" }
  );
  const socket = new WebSocket(await readDevToolsPort(profileDir));
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const listeners = new Set();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(String(data));
    if (message.id === undefined) {
      listeners.forEach((listener) => listener(message));
      return;
    }
    const waiter = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      waiter.reject(new Error(message.error.message));
    } else {
      waiter.resolve(message.result);
    }
  });

  const send = (method, params = {}, sessionId = undefined) =>
    new Promise((resolve, reject) => {
      nextId += 1;
      pending.set(nextId, { resolve, reject });
      socket.send(JSON.stringify({ id: nextId, method, params, sessionId }));
    });

  const waitForEvent = (sessionId, method) =>
    new Promise((resolve) => {
      const listener = (message) => {
        if (message.sessionId === sessionId && message.method === method) {
          listeners.delete(listener);
          resolve(message.params);
        }
      };
      listeners.add(listener);
    });

  /** `setup` runs in every document before the page's own scripts. */
  async function openPage(setup = "") {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const call = (method, params) => send(method, params, sessionId);
    await call("Page.enable");
    await call("Runtime.enable");
    if (setup) {
      await call("Page.addScriptToEvaluateOnNewDocument", { source: setup });
    }

    const evaluate = async (expression) => {
      const { result, exceptionDetails } = await call("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (exceptionDetails) {
        throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
      }
      return result.value;
    };

    const goto = async (url) => {
      const loaded = waitForEvent(sessionId, "Page.loadEventFired");
      await call("Page.navigate", { url });
      await loaded;
    };

    const close = () => send("Target.closeTarget", { targetId });
    return { call, evaluate, goto, close };
  }

  async function close() {
    socket.close();
    chrome.kill();
    await delay(300);
    await rm(profileDir, { recursive: true, force: true });
  }

  return { openPage, close };
}
