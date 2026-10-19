// @vitest-environment jsdom
/** Currency options and switching: every listed currency, live rates fetched once and kept. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITS } from "@exyconn/gcc-cost";
import { useCurrencyOptions } from "../../../../../../src/components/gcc/calculator/state/useCurrencyOptions";
import { useCurrencySwitch } from "../../../../../../src/components/gcc/calculator/state/useCurrencySwitch";
import { DEFAULT_PRESET } from "../../../../lib/gcc/preset-fixture";
import { liteEstimate, renderInCalculator } from "../../harness";

const api = vi.hoisted(() => ({ fetchCurrencies: vi.fn(), fetchFxRates: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/api", () => api);

const rate = (currency: string, inrPerUnit = 83.25) => ({
  currency,
  inrPerUnit,
  source: "ExchangeRate-API",
  asOf: "2026-10-14",
  userProvided: false,
});

/** Runs `hook` inside the calculator's providers and returns its latest value. */
function inCalculator<T>(hook: () => T, estimate = liteEstimate()) {
  const result: { current: T | null } = { current: null };
  function Probe() {
    result.current = hook();
    return null;
  }
  const view = renderInCalculator(<Probe />, { estimate, locale: "en" });
  return { ...view, result };
}

beforeEach(() => {
  api.fetchCurrencies.mockResolvedValue({ ok: false, reason: "unavailable", message: "" });
});
afterEach(() => vi.clearAllMocks());

describe("useCurrencyOptions", () => {
  it("lists INR, the preset's and the estimate's currencies by code, with their names", () => {
    const { result } = inCalculator(() => useCurrencyOptions(["CHF"]));
    const codes = result.current?.map((option) => option.code) ?? [];
    expect(codes).toEqual([...new Set(["INR", ...DEFAULT_PRESET.currencies, "CHF"])].toSorted());
    expect(result.current?.find((option) => option.code === "CHF")?.label).toBe(
      "CHF — Swiss Franc"
    );
  });

  it("adds the rate source's list once it loads, and shows a code without a name as it is", async () => {
    api.fetchCurrencies.mockResolvedValue({ ok: true, currencies: ["XQQ", "AED"] });
    const { result } = inCalculator(() => useCurrencyOptions([]));
    await waitFor(() => expect(result.current?.map((option) => option.code)).toContain("XQQ"));
    expect(result.current?.find((option) => option.code === "XQQ")?.label).toBe("XQQ");
  });

  it("ignores a list that arrives after it is gone, and logs a failed request", async () => {
    let answer: (value: unknown) => void = () => undefined;
    api.fetchCurrencies.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    const first = inCalculator(() => useCurrencyOptions([]));
    first.unmount();
    answer({ ok: true, currencies: ["XQQ"] });
    expect(first.result.current?.map((option) => option.code)).not.toContain("XQQ");

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    api.fetchCurrencies.mockRejectedValueOnce(new Error("offline"));
    inCalculator(() => useCurrencyOptions([]));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("GCC currency list failed:", expect.any(Error))
    );
  });
});

describe("useCurrencySwitch", () => {
  it("fetches and stores a live rate the first time a currency is chosen", async () => {
    api.fetchFxRates.mockResolvedValue({ ok: true, rates: [rate("USD")] });
    const { result, form } = inCalculator(() => useCurrencySwitch());
    await act(() => result.current?.switchTo("USD") ?? Promise.resolve());
    expect(api.fetchFxRates).toHaveBeenCalledWith(["USD"]);
    expect(form.current?.getValues("reportingCurrency")).toBe("USD");
    expect(form.current?.getValues("fxRates")).toEqual([rate("USD")]);
    expect(result.current?.status).toEqual({
      kind: "done",
      text: "1 USD = 83.2500 INR (rate of 2026-10-14)",
    });
  });

  it("keeps a rate the estimate already has, and needs none for INR", async () => {
    const estimate = { ...liteEstimate(), fxRates: [rate("GBP", 110)] };
    const { result, form } = inCalculator(() => useCurrencySwitch(), estimate);
    await act(() => result.current?.switchTo("GBP") ?? Promise.resolve());
    await act(() => result.current?.switchTo("INR") ?? Promise.resolve());
    expect(api.fetchFxRates).not.toHaveBeenCalled();
    expect(form.current?.getValues("reportingCurrency")).toBe("INR");
    expect(result.current?.status).toEqual({ kind: "idle" });
  });

  it("refuses another currency once the estimate holds the most rates it can", async () => {
    const codes = Array.from({ length: LIMITS.currencies }, (_, i) =>
      String.fromCodePoint(65 + i).repeat(3)
    );
    const estimate = { ...liteEstimate(), fxRates: codes.map((code) => rate(code)) };
    const { result } = inCalculator(() => useCurrencySwitch(), estimate);
    await act(() => result.current?.switchTo("ZZZ") ?? Promise.resolve());
    expect(result.current?.status.kind).toBe("failed");
    expect(api.fetchFxRates).not.toHaveBeenCalled();
  });

  it("says why a live rate could not be fetched", async () => {
    let answer: (value: unknown) => void = () => undefined;
    api.fetchFxRates.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const { result } = inCalculator(() => useCurrencySwitch());
    let switching: Promise<void> = Promise.resolve();
    act(() => {
      switching = result.current?.switchTo("USD") ?? Promise.resolve();
    });
    await waitFor(() =>
      expect(result.current?.status).toEqual({
        kind: "busy",
        text: "Fetching the USD exchange rate…",
      })
    );
    await act(async () => {
      answer({ ok: false, reason: "unavailable", message: "Rates are down." });
      await switching;
    });
    expect(result.current?.status).toEqual({
      kind: "failed",
      text: "No live rate for USD: Rates are down. Add one under Assumptions.",
    });
  });
});
