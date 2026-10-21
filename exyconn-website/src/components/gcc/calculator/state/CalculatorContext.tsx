import { createContext, useContext, useMemo, type ReactNode } from "react";
import { formatMoney, type CalculatorPreset } from "@exyconn/gcc-cost";
import type { Brand } from "../GccCalculator";
import type { SectionId } from "../strings/sections";
import type { EstimateStore } from "./useEstimateStore";
import type { LiveEstimate } from "./useLiveEstimate";

export interface CalculatorContextValue {
  preset: CalculatorPreset;
  brand: Brand;
  store: EstimateStore;
  live: LiveEstimate;
  /** Index of the scenario being edited, inside the form's `scenarios`. */
  scenarioIndex: number;
  step: SectionId;
  goTo: (step: SectionId) => void;
  locale: string;
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

export function CalculatorProvider({
  value,
  children,
}: Readonly<{ value: CalculatorContextValue; children: ReactNode }>) {
  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator(): CalculatorContextValue {
  const value = useContext(CalculatorContext);
  if (!value) {
    throw new Error("useCalculator must be used inside the GCC calculator");
  }
  return value;
}

/** The reader's locale, for number and date formatting. */
export const readerLocale = (): string => globalThis.navigator?.language || "en-IN";

/** Formats INR paise in the estimate's reporting currency (last valid rates). */
export function useMoney() {
  const { live, locale } = useCalculator();
  const currency = live.estimate?.reportingCurrency ?? "INR";
  const rates = live.estimate?.fxRates;
  return useMemo(() => {
    const list = rates ?? [];
    return {
      currency,
      format: (minor: number) => formatMoney(minor, { currency, rates: list, locale }),
      compact: (minor: number) =>
        formatMoney(minor, { currency, rates: list, locale, compact: true }),
    };
  }, [currency, rates, locale]);
}
