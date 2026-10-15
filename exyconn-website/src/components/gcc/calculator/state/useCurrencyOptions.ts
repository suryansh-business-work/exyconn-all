import { useEffect, useMemo, useState } from "react";
import { fetchCurrencies } from "../../../../lib/gcc/api";
import { useCalculator } from "./CalculatorContext";

export interface CurrencyOption {
  code: string;
  label: string;
}

/** The currency's name in the reader's language, e.g. "USD — US Dollar". */
function labelOf(code: string, names: Intl.DisplayNames): string {
  const name = names.of(code);
  return name && name !== code ? `${code} — ${name}` : code;
}

/**
 * Every currency the estimate can be shown in: the rate source's list once it loads, with the
 * page's own currencies (the CMS preset) and any the estimate already uses always included.
 */
export function useCurrencyOptions(inUse: readonly string[]): CurrencyOption[] {
  const { preset, locale } = useCalculator();
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    fetchCurrencies()
      .then((result) => {
        if (active && result.ok) {
          setCodes(result.currencies);
        }
      })
      .catch((error: unknown) => console.error("GCC currency list failed:", error));
    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "currency" });
    const all = new Set(["INR", ...preset.currencies, ...inUse, ...codes]);
    return [...all]
      .toSorted((a, b) => a.localeCompare(b))
      .map((code) => ({ code, label: labelOf(code, names) }));
  }, [codes, preset.currencies, inUse, locale]);
}
