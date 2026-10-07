// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readStored, writeStored } from "../../../../src/scripts/chrome/storage";

/** The prototype jsdom's localStorage really uses (Node may define its own `Storage`). */
const storageProto = (): Storage => Object.getPrototypeOf(localStorage) as Storage;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("chrome storage", () => {
  it("reads back what it saved, and null for a key never saved", () => {
    writeStored("a11yPreferences", '{"links":true}');
    expect(readStored("a11yPreferences")).toBe('{"links":true}');
    expect(readStored("cookieConsent")).toBeNull();
  });

  it("reads null and warns when storage is blocked", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const blocked = new Error("SecurityError");
    vi.spyOn(storageProto(), "getItem").mockImplementation(() => {
      throw blocked;
    });
    expect(readStored("cookieConsent")).toBeNull();
    expect(warn).toHaveBeenCalledWith('Preference "cookieConsent" could not be read', blocked);
  });

  it("keeps going and warns when a save fails", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const full = new Error("QuotaExceededError");
    vi.spyOn(storageProto(), "setItem").mockImplementation(() => {
      throw full;
    });
    expect(() => writeStored("cookieConsent", "accepted")).not.toThrow();
    expect(warn).toHaveBeenCalledWith('Preference "cookieConsent" could not be saved', full);
  });
});
