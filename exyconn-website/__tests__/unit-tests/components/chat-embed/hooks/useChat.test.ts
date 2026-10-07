// @vitest-environment jsdom
/** The controller behind the chat, created once per mount and read through its store. */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChat } from "../../../../../src/components/chat-embed/hooks/useChat";
import { createChatController } from "../../../../../src/components/chat-embed/state/controller";
import { createStore } from "../../../../../src/components/chat-embed/state/state";
import { makeActions, makeState } from "../chat-fixtures";

vi.mock("../../../../../src/components/chat-embed/state/controller", () => ({
  createChatController: vi.fn(),
}));

const SOCKET = "wss://portal.example.test/chat/ws";

function fakeController() {
  const controller = {
    store: createStore(makeState()),
    actions: makeActions(),
    dispose: vi.fn(),
  };
  vi.mocked(createChatController).mockReturnValue(controller);
  return controller;
}

beforeEach(() => {
  vi.mocked(createChatController).mockReset();
});

describe("useChat", () => {
  it("creates one controller for the socket and site, and exposes its actions", () => {
    const controller = fakeController();
    const { result, rerender } = renderHook(() => useChat(SOCKET, "WEBSITE"));
    rerender();
    expect(createChatController).toHaveBeenCalledTimes(1);
    expect(createChatController).toHaveBeenCalledWith(SOCKET, "WEBSITE");
    expect(result.current.actions).toBe(controller.actions);
    expect(result.current.state).toBe(controller.store.get());
  });

  it("re-renders with every new snapshot of the store", () => {
    const controller = fakeController();
    const { result } = renderHook(() => useChat(SOCKET, "TOOLS"));
    act(() => controller.store.set({ unread: 3, open: true }));
    expect(result.current.state.unread).toBe(3);
    expect(result.current.state.open).toBe(true);
  });

  it("disposes the controller when the chat unmounts", () => {
    const controller = fakeController();
    const { unmount } = renderHook(() => useChat(SOCKET, "WEBSITE"));
    expect(controller.dispose).not.toHaveBeenCalled();
    unmount();
    expect(controller.dispose).toHaveBeenCalledTimes(1);
  });
});
