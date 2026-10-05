/**
 * The visitor chat bubble (@exyconn/chat-widget), loaded and mounted once the browser is idle
 * so it never competes with the page's first paint.
 *
 * The socket lives beside the portal's GraphQL API (…/graphql → …/chat/ws). That URL is a
 * runtime setting of the server (PUBLIC_PORTAL_GRAPHQL_URL, see lib/portal/client.ts) and is
 * not present when the client bundle is built, so Page.astro prints it into
 * <meta name="exyconn-portal-graphql">, read here.
 */
import type { ChatTheme } from "@exyconn/chat-widget";
import { scale } from "../styles/tokens/scale.tokens";
import { roleVar } from "../styles/tokens/semantic.tokens";

/** Role variables, so the widget follows the site's light/dark switch. */
const theme: Partial<ChatTheme> = {
  primary: roleVar("primary"),
  onPrimary: roleVar("on-primary"),
  surface: roleVar("surface"),
  surfaceMuted: roleVar("surface-muted"),
  text: roleVar("fg"),
  textMuted: roleVar("fg-muted"),
  border: roleVar("line"),
  visitorBubble: roleVar("primary"),
  onVisitorBubble: roleVar("on-primary"),
  agentBubble: roleVar("surface-muted"),
  onAgentBubble: roleVar("fg"),
  online: roleVar("green"),
  offline: roleVar("fg-subtle"),
  danger: roleVar("red-deep"),
  onDanger: roleVar("on-solid"),
  focus: roleVar("focus-ring"),
  shadow: scale.shadow.xl,
  radius: scale.radius.xl,
  radiusBubble: scale.radius.lg,
  radiusControl: scale.radius.md,
  fontFamily: scale["font-family"].sans,
  zIndex: scale.z.overlay,
};

/** http(s)://host/graphql → ws(s)://host/chat/ws */
function socketUrlFrom(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = url.pathname.replace(/\/graphql\/?$/, "/chat/ws");
  return url.toString();
}

async function mount(): Promise<void> {
  const graphqlUrl = document
    .querySelector<HTMLMetaElement>('meta[name="exyconn-portal-graphql"]')
    ?.content.trim();
  if (!graphqlUrl) {
    console.warn("[chat-widget] PUBLIC_PORTAL_GRAPHQL_URL is not set; the chat is not shown.");
    return;
  }
  const { mountChatWidget } = await import("@exyconn/chat-widget");
  mountChatWidget({
    socketUrl: socketUrlFrom(graphqlUrl),
    site: "WEBSITE",
    theme,
    privacyUrl: "/privacy-policy",
  });
}

function start(): void {
  mount().catch((error: unknown) => console.error("[chat-widget] could not load the chat", error));
}

if ("requestIdleCallback" in globalThis) {
  globalThis.requestIdleCallback(start, { timeout: 4000 });
} else {
  setTimeout(start, 2000);
}
