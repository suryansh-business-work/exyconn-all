import type { DemoAccess } from "./whatsapp-demo.types";

/**
 * A verified visitor's demo access, kept in this browser so coming back to the page opens the
 * live demo straight away. Sign-in has no expiry; "Sign out" forgets it.
 */
const KEY = "exyconn.whatsappDemo.access";

export function loadDemoAccess(): DemoAccess | null {
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DemoAccess>) : null;
    return parsed?.token && parsed.demoUrl ? (parsed as DemoAccess) : null;
  } catch {
    return null;
  }
}

export function saveDemoAccess(access: DemoAccess): void {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(access));
  } catch (error) {
    console.error("Could not remember the demo access", error);
  }
}

export function forgetDemoAccess(): void {
  try {
    globalThis.localStorage.removeItem(KEY);
  } catch (error) {
    console.error("Could not forget the demo access", error);
  }
}

/** The demo's chats, handing the pass over in the fragment — which never reaches a server. */
export function demoChatsUrl(access: DemoAccess): string {
  const base = access.demoUrl.replace(/\/$/, "");
  return `${base}/whatsapp-demo#visitor=${encodeURIComponent(access.token)}`;
}
