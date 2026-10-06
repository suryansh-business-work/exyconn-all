import { useEffect, useState, useSyncExternalStore } from "react";
import { createChatController } from "../state/controller";
import type { ChatSite } from "../types";

/** The chat's controller, created once per mount, and its live state. */
export function useChat(socketUrl: string, site: ChatSite) {
  const [controller] = useState(() => createChatController(socketUrl, site));
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.get);
  useEffect(() => () => controller.dispose(), [controller]);
  return { state, actions: controller.actions };
}
