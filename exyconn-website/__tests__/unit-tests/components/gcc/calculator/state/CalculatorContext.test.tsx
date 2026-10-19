// @vitest-environment jsdom
/** The calculator context: required inside the island, the reader's locale, money in any currency. */
import { renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readerLocale,
  useCalculator,
  useMoney,
} from "../../../../../../src/components/gcc/calculator/state/CalculatorContext";
import { liteEstimate, renderInCalculator } from "../../harness";

function Amount({ minor }: Readonly<{ minor: number }>) {
  const money = useMoney();
  return (
    <p>
      {money.currency}: {money.format(minor)} / {money.compact(minor)}
    </p>
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("CalculatorContext", () => {
  it("refuses to be used outside the calculator", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useCalculator())).toThrow(
      "useCalculator must be used inside the GCC calculator"
    );
  });

  it("reads the browser's language, or Indian English without one", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(readerLocale()).toBe("de-DE");
    vi.stubGlobal("navigator", { language: "" });
    expect(readerLocale()).toBe("en-IN");
    vi.stubGlobal("navigator", undefined);
    expect(readerLocale()).toBe("en-IN");
  });

  it("formats in the estimate's reporting currency with its rates", async () => {
    const estimate = {
      ...liteEstimate(),
      reportingCurrency: "USD",
      fxRates: [
        {
          currency: "USD",
          inrPerUnit: 100,
          source: "Test",
          asOf: "2026-10-14",
          userProvided: true,
        },
      ],
    };
    renderInCalculator(<Amount minor={1_000_000_00} />, { estimate, locale: "en-US" });
    expect(await screen.findByText(/^USD: /)).toHaveTextContent("USD: $10,000 / $10K");
  });

  it("formats in rupees until the estimate is valid", () => {
    renderInCalculator(<Amount minor={100_00} />, { estimate: { ...liteEstimate(), name: "" } });
    expect(screen.getByText(/^INR: /)).toHaveTextContent("₹");
  });
});
