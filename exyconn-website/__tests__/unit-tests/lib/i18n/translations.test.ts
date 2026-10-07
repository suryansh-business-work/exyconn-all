import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

type Translations = typeof import("../../../../src/lib/i18n/translations");
let i18n: Translations;

const FIVE_MINUTES = 5 * 60 * 1000;

const bundle = (pairs: Record<string, string>) => ({
  localeBundle: {
    locale: "fr",
    translations: Object.entries(pairs).map(([source, text]) => ({ source, text })),
  },
});

const answered = (sources: readonly string[]) => ({
  translateMissing: sources.map((source) => ({ source, text: `fr:${source}` })),
});

const sentSources = (call: number): string[] => portalRequest.mock.calls[call][1].sources;

beforeEach(async () => {
  vi.useFakeTimers({ now: new Date("2026-10-07T10:00:00Z") });
  vi.resetModules();
  portalRequest.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  i18n = await import("../../../../src/lib/i18n/translations");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("loading a language's catalogue", () => {
  it("reads the catalogue from the portal, keyed by the English source", async () => {
    portalRequest.mockResolvedValue(bundle({ Hello: "Bonjour", Contact: "Contact" }));

    await expect(i18n.loadMessages("fr")).resolves.toEqual({
      Hello: "Bonjour",
      Contact: "Contact",
    });
    expect(portalRequest).toHaveBeenCalledWith(expect.stringContaining("localeBundle"), {
      locale: "fr",
    });
  });

  it("serves the same catalogue for five minutes, then asks again", async () => {
    portalRequest.mockResolvedValue(bundle({ Hello: "Bonjour" }));
    const first = await i18n.loadMessages("fr");

    vi.advanceTimersByTime(FIVE_MINUTES - 1);
    expect(await i18n.loadMessages("fr")).toBe(first);
    expect(portalRequest).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await i18n.loadMessages("fr");
    expect(portalRequest).toHaveBeenCalledTimes(2);
  });

  it("serves English when the portal fails, without asking again on every page", async () => {
    portalRequest.mockRejectedValue(new Error("portal down"));

    await expect(i18n.loadMessages("fr")).resolves.toEqual({});
    await expect(i18n.loadMessages("fr")).resolves.toEqual({});
    expect(portalRequest).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Translations for fr could not be loaded"),
      expect.any(Error)
    );
  });
});

describe("translating strings a language has never seen", () => {
  beforeEach(() => {
    portalRequest.mockImplementation(async (_query: string, variables: { sources: string[] }) =>
      answered(variables.sources)
    );
  });

  it("asks once per string, in batches of fifty, and answers with the catalogue", async () => {
    const sources = Array.from({ length: 120 }, (_, index) => `String ${index}`);

    const result = await i18n.translateMissing("fr", [...sources, "String 0"], 5000);

    expect(portalRequest).toHaveBeenCalledTimes(3);
    expect([0, 1, 2].map((call) => sentSources(call).length)).toEqual([50, 50, 20]);
    expect(portalRequest.mock.calls[0][0]).toContain("translateMissing");
    expect(Object.keys(result)).toHaveLength(120);
    expect(result["String 7"]).toBe("fr:String 7");
    // The new words are now the catalogue the next reader is served.
    expect(await i18n.loadMessages("fr")).toBe(result);
    expect(portalRequest).toHaveBeenCalledTimes(3);
  });

  it("merges into the loaded catalogue as a new object, so cached pages re-render", async () => {
    portalRequest.mockResolvedValueOnce(bundle({ Hello: "Bonjour" }));
    const before = await i18n.loadMessages("fr");

    const after = await i18n.translateMissing("fr", ["World"], 5000);

    expect(after).toEqual({ Hello: "Bonjour", World: "fr:World" });
    expect(after).not.toBe(before);
    expect(await i18n.loadMessages("fr")).toBe(after);
  });

  it("keeps the catalogue object when nothing came back", async () => {
    portalRequest.mockResolvedValueOnce(bundle({ Hello: "Bonjour" }));
    const before = await i18n.loadMessages("fr");
    portalRequest.mockResolvedValueOnce({ translateMissing: [] });

    expect(await i18n.translateMissing("fr", ["World"], 5000)).toBe(before);
  });

  it("answers with an empty catalogue when there is nothing to ask", async () => {
    await expect(i18n.translateMissing("it", [], 5000)).resolves.toEqual({});
    expect(portalRequest).not.toHaveBeenCalled();
  });

  it("logs a failed batch and asks for its strings again next time", async () => {
    portalRequest.mockRejectedValueOnce(new Error("model down"));

    await expect(i18n.translateMissing("fr", ["One", "Two"], 5000)).resolves.toEqual({});
    expect(console.error).toHaveBeenCalledWith(
      "Could not ask the portal to translate 2 strings.",
      expect.any(Error)
    );

    await i18n.translateMissing("fr", ["One", "Two"], 5000);
    expect(sentSources(1)).toEqual(["One", "Two"]);
  });

  it("asks again for a string that came back untranslated", async () => {
    portalRequest.mockResolvedValueOnce(answered(["One"]));
    expect(await i18n.translateMissing("fr", ["One", "Two"], 5000)).toEqual({ One: "fr:One" });

    await i18n.translateMissing("fr", ["Two"], 5000);
    expect(sentSources(1)).toEqual(["Two"]);
  });
});
