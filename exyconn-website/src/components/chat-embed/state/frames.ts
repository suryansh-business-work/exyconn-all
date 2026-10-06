import { readItem, removeItem, writeItem, type StorageKeys } from "../lib/storage";
import type { ChatMessage, ServerFrame, WidgetConfig } from "../types";
import type { Notifier } from "./notifier";
import { emptyThreads, type Store } from "./state";
import {
  countUnread,
  failOne,
  markVisitorRead,
  mergeHistory,
  replaceMessage,
  upsertMessage,
} from "./threads";

export interface FrameContext {
  store: Store;
  keys: Readonly<StorageKeys>;
  notifier: Notifier;
  markRead(): void;
}

type Frame<T extends ServerFrame["t"]> = Extract<ServerFrame, { t: T }>;

function onConfig(ctx: FrameContext, config: WidgetConfig): void {
  const storedSound = readItem(ctx.keys.sound);
  const soundOn = storedSound === null ? config.soundEnabledByDefault : storedSound === "on";
  const open = config.enabled && ctx.store.get().open;
  ctx.store.set({ config, soundOn, open });
}

function onSignedIn(ctx: FrameContext, frame: Frame<"signedIn">): void {
  const { store } = ctx;
  writeItem(ctx.keys.token, frame.token);
  const unread = countUnread(frame.messages);
  const seeing = ctx.notifier.seeing();
  store.set({
    step: "signedIn",
    session: frame.session,
    threads: mergeHistory(frame.messages, store.get().threads),
    busy: false,
    error: "",
    unread: seeing ? 0 : unread,
  });
  if (seeing && unread > 0) {
    ctx.markRead();
  }
}

function onMessage(ctx: FrameContext, message: ChatMessage, clientId?: string): void {
  const state = ctx.store.get();
  const { channel } = message;
  const { items, added } = upsertMessage(state.threads[channel], message, clientId);
  const typing = message.sender === "VISITOR" ? state.typing : { ...state.typing, [channel]: "" };
  ctx.store.set({ threads: { ...state.threads, [channel]: items }, typing });
  if (added && message.sender !== "VISITOR") {
    ctx.notifier.incoming(message);
  }
}

function onTyping(ctx: FrameContext, frame: Frame<"typing">): void {
  const state = ctx.store.get();
  // The team only ever writes in the live thread; the bot says which thread it is answering.
  const channel = frame.who === "AGENT" ? "LIVE" : (frame.channel ?? "KNOWLEDGE");
  ctx.store.set({ typing: { ...state.typing, [channel]: frame.on ? frame.name : "" } });
}

function onError(ctx: FrameContext, frame: Frame<"error">): void {
  const state = ctx.store.get();
  if (frame.clientId) {
    // Only the message the error names is marked; its bubble offers Retry and Dismiss.
    ctx.store.set({ busy: false, threads: failOne(state.threads, frame.clientId, frame.message) });
    return;
  }
  ctx.store.set({ busy: false, error: frame.message });
}

/** Applies one server frame to the chat's state. */
export function handleFrame(ctx: FrameContext, frame: ServerFrame): void {
  const { store } = ctx;
  const state = store.get();
  switch (frame.t) {
    case "config":
      onConfig(ctx, frame.config);
      return;
    case "codeSent":
      store.set({ step: "code", codeSentAt: Date.now(), busy: false, error: "" });
      return;
    case "signedIn":
      onSignedIn(ctx, frame);
      return;
    case "signedOut":
      removeItem(ctx.keys.token);
      store.set({ step: "form", session: null, threads: emptyThreads(), busy: false, unread: 0 });
      return;
    case "message":
      onMessage(ctx, frame.message, frame.clientId);
      return;
    case "messageUpdated":
      store.set({ threads: replaceMessage(state.threads, frame.message) });
      return;
    case "typing":
      onTyping(ctx, frame);
      return;
    case "read":
      store.set({
        threads: { ...state.threads, LIVE: markVisitorRead(state.threads.LIVE, frame.at) },
      });
      return;
    case "session":
      store.set({ session: frame.session });
      return;
    case "error":
      onError(ctx, frame);
      return;
    case "pong":
      return;
  }
}
