/** The CMS reads' TTL cache: expiry, the entry cap and read-through loading. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cached, createTtlCache } from "../../../../src/lib/cms/cache";

describe("createTtlCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a value until its time is up, then forgets it", () => {
    const cache = createTtlCache<string>(1000, 10);
    cache.set("a", "one");
    vi.advanceTimersByTime(999);
    expect(cache.get("a")).toBe("one");
    vi.advanceTimersByTime(1);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("a")).toBeUndefined();
  });

  it("answers undefined for a key never set", () => {
    expect(createTtlCache<number>(1000, 10).get("missing")).toBeUndefined();
  });

  it("drops the oldest entry past the cap", () => {
    const cache = createTtlCache<number>(1000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
  });

  it("refreshes a key's age and position when it is set again", () => {
    const cache = createTtlCache<number>(1000, 2);
    cache.set("a", 1);
    cache.set("b", 2);
    vi.advanceTimersByTime(600);
    cache.set("a", 10);
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    vi.advanceTimersByTime(600);
    expect(cache.get("a")).toBe(10);
  });
});

describe("cached", () => {
  it("loads once and serves the remembered value afterwards", async () => {
    const cache = createTtlCache<string>(60_000, 10);
    const load = vi.fn().mockResolvedValue("fresh");
    await expect(cached(cache, "k", load)).resolves.toBe("fresh");
    await expect(cached(cache, "k", load)).resolves.toBe("fresh");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("does not remember a failed load", async () => {
    const cache = createTtlCache<string>(60_000, 10);
    const load = vi.fn().mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce("ok");
    await expect(cached(cache, "k", load)).rejects.toThrow("down");
    await expect(cached(cache, "k", load)).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("caches a null answer too", async () => {
    const cache = createTtlCache<string | null>(60_000, 10);
    const load = vi.fn().mockResolvedValue(null);
    await cached(cache, "k", load);
    await expect(cached(cache, "k", load)).resolves.toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
