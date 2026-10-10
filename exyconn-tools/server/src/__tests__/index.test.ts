import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listen: vi.fn(), createApp: vi.fn() }));
vi.mock("../app", () => ({ createApp: mocks.createApp, PORT: 4999 }));

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("server entry point", () => {
  it("builds the app and listens on the configured port, announcing where", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    mocks.listen.mockImplementation((_port: number, onListening: () => void) =>
      onListening(),
    );
    mocks.createApp.mockReturnValue({ listen: mocks.listen });

    await import("../index.js");

    expect(mocks.createApp).toHaveBeenCalledTimes(1);
    expect(mocks.listen).toHaveBeenCalledWith(4999, expect.any(Function));
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:4999"),
    );
    expect(log).toHaveBeenCalledWith(expect.stringContaining("/health"));
  });
});
