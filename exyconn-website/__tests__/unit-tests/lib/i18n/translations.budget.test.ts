import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const portalRequest = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal/client", () => ({ portalRequest }));

type Translations = typeof import("../../../../src/lib/i18n/translations");
let i18n: Translations;

/** Each portal call parks here until the test answers it. */
let pending: Array<(value: unknown) => void> = [];

const answered = (sources: readonly string[]) => ({
  translateMissing: sources.map((source) => ({ source, text: `de:${source}` })),
});

const sentSources = (call: number): string[] => portalRequest.mock.calls[call][1].sources;

/** Lets a chain of awaited promises settle without moving the fake clock. */
const flush = async () => {
  for (let tick = 0; tick < 20; tick += 1) {
    await Promise.resolve();
  }
};

beforeEach(async () => {
  vi.useFakeTimers({ now: new Date("2026-10-07T10:00:00Z") });
  vi.resetModules();
  pending = [];
  portalRequest.mockReset();
  portalRequest.mockImplementation(
    () =>
      new Promise((resolve) => {
        pending.push(resolve);
      })
  );
  i18n = await import("../../../../src/lib/i18n/translations");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the first reader's time budget", () => {
  it("answers with what has arrived once the budget runs out, and keeps the rest coming", async () => {
    let settled = false;
    const result = i18n.translateMissing("de", ["Hello"], 3000).then((messages) => {
      settled = true;
      return messages;
    });

    await vi.advanceTimersByTimeAsync(2999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({});

    // The batch lands after the budget, in the catalogue the next reader is served.
    pending[0](answered(["Hello"]));
    await flush();
    await expect(i18n.loadMessages("de")).resolves.toEqual({ Hello: "de:Hello" });
    expect(portalRequest).toHaveBeenCalledTimes(1);
  });

  it("never asks twice for a string that is already on its way", async () => {
    const first = i18n.translateMissing("de", ["Hello"], 1000);
    const second = i18n.translateMissing("de", ["Hello", "World"], 1000);

    expect(portalRequest).toHaveBeenCalledTimes(2);
    expect(sentSources(0)).toEqual(["Hello"]);
    expect(sentSources(1)).toEqual(["World"]);

    await vi.advanceTimersByTimeAsync(1000);
    await expect(Promise.all([first, second])).resolves.toEqual([{}, {}]);

    pending[0](answered(["Hello"]));
    pending[1](answered(["World"]));
    await flush();
    await expect(i18n.loadMessages("de")).resolves.toEqual({
      Hello: "de:Hello",
      World: "de:World",
    });
  });

  it("sends at most four batches at once, starting the next as one finishes", async () => {
    const sources = Array.from({ length: 250 }, (_, index) => `Word ${index}`);
    const result = i18n.translateMissing("de", sources, 60_000);

    expect(portalRequest).toHaveBeenCalledTimes(4);

    pending[0](answered(sentSources(0)));
    await flush();
    expect(portalRequest).toHaveBeenCalledTimes(5);
    expect(sentSources(4)).toEqual(sources.slice(200, 250));

    for (const [call, resolve] of pending.slice(1).entries()) {
      resolve(answered(sentSources(call + 1)));
    }
    const messages = await result;
    expect(Object.keys(messages)).toHaveLength(250);
    expect(messages["Word 249"]).toBe("de:Word 249");
  });
});
