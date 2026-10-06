import { useEffect, useRef, useState } from "react";
import {
  postToHost,
  readHostMessage,
  referrerOrigin,
  type FrameSize,
  type FromHost,
} from "../lib/host";

interface HostBridgeOptions {
  size: FrameSize;
  unread: number;
  onMessage: (message: FromHost) => void;
}

/**
 * Keeps the loader on the host page in step with the chat: says when it is ready, asks for the
 * iframe size it needs (launcher only, the open panel, or nothing), reports the unread count,
 * and hands every valid host message (page URL, theme, layout) to `onMessage`.
 */
export function useHostBridge({ size, unread, onMessage }: Readonly<HostBridgeOptions>) {
  const [origin, setOrigin] = useState(referrerOrigin);
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    const listen = (event: MessageEvent): void => {
      const message = readHostMessage(event);
      if (message) {
        setOrigin(event.origin);
        handler.current(message);
      }
    };
    globalThis.addEventListener("message", listen);
    postToHost({ type: "ready" }, referrerOrigin());
    return () => globalThis.removeEventListener("message", listen);
  }, []);

  useEffect(() => postToHost({ type: "resize", state: size }, origin), [size, origin]);
  useEffect(() => postToHost({ type: "unread", count: unread }, origin), [unread, origin]);
}
