// @vitest-environment jsdom
/** The launcher and the panel, and how they follow the chat state and the host page. */
import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWidget } from "../../../../../src/components/chat-embed/components/ChatWidget";
import { useChat } from "../../../../../src/components/chat-embed/hooks/useChat";
import { useHostBridge } from "../../../../../src/components/chat-embed/hooks/useHostBridge";
import type { ChatState } from "../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../test-utils";
import { makeActions, makeConfig, makeState, type MockActions } from "../chat-fixtures";

const { setMode } = vi.hoisted(() => ({ setMode: vi.fn() }));

vi.mock("../../../../../src/components/chat-embed/hooks/useChat", () => ({ useChat: vi.fn() }));
vi.mock("../../../../../src/components/chat-embed/hooks/useHostBridge", () => ({
  useHostBridge: vi.fn(),
}));
vi.mock("@mui/material/styles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mui/material/styles")>()),
  useColorScheme: () => ({ setMode }),
}));

const SOCKET = "wss://portal.example.test/chat/ws";
let actions: MockActions;

function chatIs(state: ChatState) {
  vi.mocked(useChat).mockReturnValue({ state, actions });
}

const widget = () => <ChatWidget socketUrl={SOCKET} site="WEBSITE" reducedMotion />;
const bridge = () => vi.mocked(useHostBridge).mock.lastCall?.[0];
const launcher = () => screen.getByRole("button", { name: /^Open chat/ });

beforeEach(() => {
  actions = makeActions();
  setMode.mockReset();
  vi.mocked(useHostBridge).mockReset();
  globalThis.history.replaceState(null, "", "/embed/chat");
});

describe("ChatWidget", () => {
  it("shows nothing, and asks the loader to hide it, when the chat is switched off", () => {
    chatIs(makeState({ config: makeConfig({ enabled: false }), open: true }));
    const { container } = renderInChatTheme(widget());
    expect(container).toBeEmptyDOMElement();
    expect(bridge()?.size).toBe("hidden");
    expect(useChat).toHaveBeenCalledWith(SOCKET, "WEBSITE");
  });

  it("shows the launcher with the unread count while closed", async () => {
    chatIs(makeState({ unread: 2 }));
    const { user } = renderInChatTheme(widget());
    expect(bridge()).toMatchObject({ size: "closed", unread: 2 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: `${strings.openChat}, ${strings.unread(2)}` })
    );
    expect(actions.open).toHaveBeenCalledTimes(1);
  });

  it("shows the panel on the section in the URL while open", () => {
    globalThis.history.replaceState(null, "", "/embed/chat?tab=faqs");
    chatIs(makeState({ open: true, config: makeConfig() }));
    renderInChatTheme(widget());
    expect(screen.getByRole("dialog", { name: strings.defaultTitle })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: strings.tabFaqs })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.queryByRole("button", { name: /^Open chat/ })).not.toBeInTheDocument();
    expect(bridge()?.size).toBe("open");
  });

  it("keeps the section choice in the URL", async () => {
    chatIs(makeState({ open: true, config: makeConfig() }));
    const { user } = renderInChatTheme(widget());
    await user.click(screen.getByRole("tab", { name: strings.tabKnowledge }));
    expect(new URL(globalThis.location.href).searchParams.get("tab")).toBe("knowledge");
    expect(screen.getByRole("tab", { name: strings.tabKnowledge })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("follows the host page's URL, theme and layout", () => {
    chatIs(makeState({ open: true, config: makeConfig() }));
    renderInChatTheme(widget());
    expect(screen.getByRole("dialog")).toHaveStyle({ maxWidth: "420px" });
    act(() => bridge()?.onMessage({ type: "page", url: "https://host.example.test/pricing" }));
    expect(actions.setPageUrl).toHaveBeenCalledWith("https://host.example.test/pricing");
    act(() => bridge()?.onMessage({ type: "theme", theme: "dark" }));
    expect(setMode).toHaveBeenCalledWith("dark");
    act(() => bridge()?.onMessage({ type: "layout", compact: true }));
    expect(screen.getByRole("dialog")).toHaveStyle({ maxWidth: "none" });
  });

  it("minimises, keeps the frame open until the panel has gone, then refocuses the launcher", async () => {
    chatIs(makeState({ open: true, config: makeConfig() }));
    const { user, rerender } = renderInChatTheme(widget());
    await user.click(screen.getByRole("button", { name: strings.minimise }));
    expect(actions.close).toHaveBeenCalledTimes(1);
    chatIs(makeState({ open: false, config: makeConfig() }));
    rerender(widget());
    await waitFor(() => expect(launcher()).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bridge()?.size).toBe("closed");
  });

  it("does not move the focus when the chat closes by itself", async () => {
    chatIs(makeState({ open: true, config: makeConfig() }));
    const { rerender } = renderInChatTheme(widget());
    chatIs(makeState({ open: false, config: makeConfig() }));
    rerender(widget());
    const button = await screen.findByRole("button", { name: /^Open chat/ });
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(button).not.toHaveFocus();
  });
});
