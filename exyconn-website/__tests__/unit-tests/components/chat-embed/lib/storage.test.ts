/** Guarded localStorage: a refused store only costs the visitor a remembered value. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readItem,
  removeItem,
  storageKeys,
  writeItem,
} from "../../../../../src/components/chat-embed/lib/storage";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

function refusingStorage() {
  const refuse = () => {
    throw new Error("The operation is insecure.");
  };
  return { getItem: refuse, setItem: refuse, removeItem: refuse };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("chat storage", () => {
  it("writes, reads and forgets a value", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    expect(readItem("k")).toBeNull();
    writeItem("k", "on");
    expect(readItem("k")).toBe("on");
    removeItem("k");
    expect(readItem("k")).toBeNull();
  });

  it("warns and carries on when the browser refuses storage", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("localStorage", refusingStorage());
    expect(readItem("k")).toBeNull();
    expect(() => writeItem("k", "on")).not.toThrow();
    expect(() => removeItem("k")).not.toThrow();
    expect(warn.mock.calls.map((call) => call[0])).toEqual([
      "[chat] could not read",
      "[chat] could not save",
      "[chat] could not forget",
    ]);
    expect(warn).toHaveBeenCalledWith("[chat] could not read", "k", expect.any(Error));
  });
});

describe("storageKeys", () => {
  it("keeps each site's pass and sound preference apart", () => {
    expect(storageKeys("WEBSITE")).toEqual({
      token: "exyconn-chat:WEBSITE:token",
      sound: "exyconn-chat:WEBSITE:sound",
    });
    expect(storageKeys("TOOLS").token).toBe("exyconn-chat:TOOLS:token");
  });
});
