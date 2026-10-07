// @vitest-environment jsdom
/** The verified visitor's demo access, remembered in this browser. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  demoChatsUrl,
  forgetDemoAccess,
  loadDemoAccess,
  saveDemoAccess,
} from "../../../../../src/components/forms/whatsapp-demo/demoAccessStore";

const KEY = "exyconn.whatsappDemo.access";
const ACCESS = { token: "pass-1", demoUrl: "https://demo.example", name: "Meera Iyer" };

afterEach(() => {
  vi.unstubAllGlobals();
  globalThis.localStorage.clear();
  vi.restoreAllMocks();
});

describe("demo access store", () => {
  it("remembers, reads back and forgets the access", () => {
    expect(loadDemoAccess()).toBeNull();
    saveDemoAccess(ACCESS);
    expect(JSON.parse(globalThis.localStorage.getItem(KEY) ?? "null")).toEqual(ACCESS);
    expect(loadDemoAccess()).toEqual(ACCESS);
    forgetDemoAccess();
    expect(globalThis.localStorage.getItem(KEY)).toBeNull();
    expect(loadDemoAccess()).toBeNull();
  });

  it("ignores a stored value without a pass or an address", () => {
    globalThis.localStorage.setItem(KEY, JSON.stringify({ token: "pass-1" }));
    expect(loadDemoAccess()).toBeNull();
    globalThis.localStorage.setItem(KEY, JSON.stringify({ demoUrl: "https://demo.example" }));
    expect(loadDemoAccess()).toBeNull();
    globalThis.localStorage.setItem(KEY, "null");
    expect(loadDemoAccess()).toBeNull();
  });

  it("ignores a stored value that is not JSON", () => {
    globalThis.localStorage.setItem(KEY, "{broken");
    expect(loadDemoAccess()).toBeNull();
  });

  it("logs, rather than throws, when storage is blocked", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const blocked = new Error("blocked");
    const refuse = () => {
      throw blocked;
    };
    vi.stubGlobal("localStorage", { getItem: refuse, setItem: refuse, removeItem: refuse });
    expect(() => saveDemoAccess(ACCESS)).not.toThrow();
    expect(() => forgetDemoAccess()).not.toThrow();
    expect(loadDemoAccess()).toBeNull();
    expect(log).toHaveBeenCalledWith("Could not remember the demo access", blocked);
    expect(log).toHaveBeenCalledWith("Could not forget the demo access", blocked);
  });
});

describe("demoChatsUrl", () => {
  it("hands the pass over in the fragment, encoded", () => {
    expect(demoChatsUrl({ ...ACCESS, token: "a b/c" })).toBe(
      "https://demo.example/whatsapp-demo#visitor=a%20b%2Fc"
    );
  });

  it("does not double the slash after the address", () => {
    expect(demoChatsUrl({ ...ACCESS, demoUrl: "https://demo.example/" })).toBe(
      "https://demo.example/whatsapp-demo#visitor=pass-1"
    );
  });
});
