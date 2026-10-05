import { createContext, useContext, useEffect, useRef } from 'react';
import type { ChatAlertPrefs } from './alerts/chatAlertPrefs';
import type { ChatConnection, FrameListener, StaffClientFrame } from './socket/chatSocket.types';

/** What every chat page reaches: the shared socket and this browser's alert choices. */
export interface ChatConsole {
  connection: ChatConnection;
  /** False when the socket is not signed in, so the frame did not go. */
  send: (frame: StaffClientFrame) => boolean;
  subscribe: (listener: FrameListener) => () => void;
  prefs: ChatAlertPrefs;
  setPrefs: (next: ChatAlertPrefs) => void;
}

export const ChatConsoleContext = createContext<ChatConsole | null>(null);

export function useChatConsole(): ChatConsole {
  const value = useContext(ChatConsoleContext);
  if (!value) {
    throw new Error('useChatConsole must be used inside ChatLayout');
  }
  return value;
}

/** Calls `listener` with every frame the server sends, always the latest render's listener. */
export function useChatFrames(listener: FrameListener): void {
  const { subscribe } = useChatConsole();
  const latest = useRef(listener);
  latest.current = listener;
  useEffect(() => subscribe((frame) => latest.current(frame)), [subscribe]);
}
