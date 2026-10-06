import type { ColorMode } from "../types";

/**
 * The postMessage bridge to the loader (public/embed/chat.js) on the page that embeds this
 * iframe. Both directions are namespaced: the chat sends `{ source: 'exy-chat' }`, the loader
 * sends `{ source: 'exy-chat-host' }`.
 */
export type FrameSize = "closed" | "open" | "hidden";

export type ToHost =
  { type: "ready" } | { type: "resize"; state: FrameSize } | { type: "unread"; count: number };

export type FromHost =
  | { type: "page"; url: string }
  | { type: "theme"; theme: ColorMode }
  | { type: "layout"; compact: boolean };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** True inside an iframe; false when /embed/chat is opened on its own. */
export function isEmbedded(): boolean {
  return globalThis.parent !== globalThis.window;
}

/**
 * The embedding page's origin: `ancestorOrigins` where the browser has it (exact, whatever the
 * host's referrer policy), else the referrer the iframe was loaded with.
 */
export function referrerOrigin(): string {
  const ancestor = globalThis.location.ancestorOrigins?.[0];
  if (ancestor) {
    return ancestor;
  }
  try {
    return document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    return "";
  }
}

/** Posts to the loader; a no-op when nothing embeds the chat or its origin is unknown. */
export function postToHost(message: ToHost, origin: string): void {
  if (!isEmbedded() || origin === "") {
    return;
  }
  globalThis.parent.postMessage({ source: "exy-chat", ...message }, origin);
}

/** A message from the loader, or null for anything else (other frames, other scripts). */
export function readHostMessage(event: MessageEvent): FromHost | null {
  const { data } = event;
  if (event.source !== globalThis.parent || !isRecord(data) || data.source !== "exy-chat-host") {
    return null;
  }
  if (data.type === "page" && typeof data.url === "string") {
    return { type: "page", url: data.url };
  }
  if (data.type === "theme" && (data.theme === "light" || data.theme === "dark")) {
    return { type: "theme", theme: data.theme };
  }
  if (data.type === "layout" && typeof data.compact === "boolean") {
    return { type: "layout", compact: data.compact };
  }
  return null;
}
