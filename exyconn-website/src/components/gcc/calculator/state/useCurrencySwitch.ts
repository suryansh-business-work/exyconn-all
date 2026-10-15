import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { LIMITS, type Estimate } from "@exyconn/gcc-cost";
import { fetchFxRates } from "../../../../lib/gcc/api";
import { UI } from "../strings/ui";

export type CurrencySwitchStatus =
  | { kind: "idle" }
  | { kind: "busy"; text: string }
  | { kind: "done"; text: string }
  | { kind: "failed"; text: string };

const C = UI.currency;

/**
 * Shows the estimate in another currency. The rate is fetched and stored with the estimate the
 * first time a currency is chosen (its source and date go with it, so the figures stay
 * reproducible); a currency that already has a rate — fetched or typed in — keeps it.
 */
export function useCurrencySwitch() {
  const { getValues, setValue } = useFormContext<Estimate>();
  const [status, setStatus] = useState<CurrencySwitchStatus>({ kind: "idle" });

  const switchTo = useCallback(
    async (code: string) => {
      const options = { shouldDirty: true, shouldValidate: true } as const;
      setValue("reportingCurrency", code, options);
      const rates = getValues("fxRates");
      if (code === "INR" || rates.some((rate) => rate.currency === code)) {
        setStatus({ kind: "idle" });
        return;
      }
      if (rates.length >= LIMITS.currencies) {
        setStatus({ kind: "failed", text: C.full });
        return;
      }
      setStatus({ kind: "busy", text: C.fetching(code) });
      const result = await fetchFxRates([code]);
      if (!result.ok) {
        setStatus({ kind: "failed", text: C.failed(code, result.message) });
        return;
      }
      const latest = getValues("fxRates").filter((rate) => rate.currency !== code);
      setValue("fxRates", [...latest, ...result.rates], options);
      const [rate] = result.rates;
      setStatus({ kind: "done", text: C.fetched(code, rate.inrPerUnit.toFixed(4), rate.asOf) });
    },
    [getValues, setValue]
  );

  return { switchTo, status };
}
