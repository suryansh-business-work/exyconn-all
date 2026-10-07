import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cachePage, cachedPage, clearPageCache } from "../../../../src/lib/i18n/page-cache";

const TEN_MINUTES = 10 * 60 * 1000;

describe("translated page cache", () => {
  const messages = { Hello: "Bonjour" };

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2026-10-07T10:00:00Z") });
    clearPageCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has nothing for a page that was never cached", () => {
    expect(cachedPage("fr-fr", "/about-us", messages)).toBeUndefined();
  });

  it("serves a cached page translated with the same catalogue", () => {
    cachePage("fr-fr", "/about-us", "<p>Bonjour</p>", messages);
    expect(cachedPage("fr-fr", "/about-us", messages)).toBe("<p>Bonjour</p>");
  });

  it("keys pages by market, so two markets of one language never share a page", () => {
    cachePage("fr-fr", "/about-us", "<html lang=fr-FR>", messages);
    expect(cachedPage("fr-ca", "/about-us", messages)).toBeUndefined();
    expect(cachedPage("fr-fr", "/contact", messages)).toBeUndefined();
  });

  it("drops a page once the catalogue object it was translated with is replaced", () => {
    cachePage("fr-fr", "/", "<p>old</p>", messages);
    expect(cachedPage("fr-fr", "/", { ...messages })).toBeUndefined();
    // The stale entry is gone, not just hidden: the original catalogue no longer finds it.
    expect(cachedPage("fr-fr", "/", messages)).toBeUndefined();
  });

  it("keeps a page for exactly ten minutes and then lets it age out", () => {
    cachePage("de-de", "/", "<p>Hallo</p>", messages);
    vi.advanceTimersByTime(TEN_MINUTES);
    expect(cachedPage("de-de", "/", messages)).toBe("<p>Hallo</p>");
    vi.advanceTimersByTime(1);
    expect(cachedPage("de-de", "/", messages)).toBeUndefined();
  });

  it("replaces a page cached again under the same key", () => {
    cachePage("de-de", "/", "<p>one</p>", messages);
    cachePage("de-de", "/", "<p>two</p>", messages);
    expect(cachedPage("de-de", "/", messages)).toBe("<p>two</p>");
  });

  it("evicts the oldest page once five hundred are held", () => {
    for (let index = 0; index < 500; index += 1) {
      cachePage("en-in", `/${index}`, `page ${index}`, messages);
    }
    expect(cachedPage("en-in", "/0", messages)).toBe("page 0");

    cachePage("en-in", "/500", "page 500", messages);

    expect(cachedPage("en-in", "/0", messages)).toBeUndefined();
    expect(cachedPage("en-in", "/1", messages)).toBe("page 1");
    expect(cachedPage("en-in", "/500", messages)).toBe("page 500");
  });

  it("forgets everything when cleared", () => {
    cachePage("it-it", "/", "<p>Ciao</p>", messages);
    clearPageCache();
    expect(cachedPage("it-it", "/", messages)).toBeUndefined();
  });
});
