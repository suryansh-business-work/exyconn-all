import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import { useFormContext, useWatch } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { FX_ATTRIBUTION_URL } from "../../../../lib/gcc/fx-attribution";
import { useCurrencyOptions, type CurrencyOption } from "../state/useCurrencyOptions";
import { useCurrencySwitch } from "../state/useCurrencySwitch";
import { UI } from "../strings/ui";

const C = UI.currency;

/**
 * Picks the currency the whole estimate is shown in, from every currency the rate source knows.
 * Choosing one without a rate fetches its live rate into the estimate's assumptions. `credit`
 * shows the rate source's attribution, which the page must carry once (the summary card does).
 */
export function CurrencyPicker({ id, credit = false }: Readonly<{ id: string; credit?: boolean }>) {
  const { control } = useFormContext<Estimate>();
  const current = useWatch({ control, name: "reportingCurrency" });
  const rates = useWatch({ control, name: "fxRates" });
  const options = useCurrencyOptions(rates.map((rate) => rate.currency));
  const { switchTo, status } = useCurrencySwitch();
  const value = options.find((option) => option.code === current) ?? null;
  const busy = status.kind === "busy";
  const message = status.kind === "idle" ? C.hint : status.text;

  return (
    <div className="gcc-currency">
      <Autocomplete<CurrencyOption, false, true>
        id={id}
        options={options}
        value={value ?? undefined}
        disableClearable
        autoHighlight
        noOptionsText={C.noMatch}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, chosen) => option.code === chosen.code}
        onChange={(_event, option) => {
          switchTo(option.code).catch((error: unknown) =>
            console.error("GCC currency switch failed:", error)
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={C.label}
            error={status.kind === "failed"}
            helperText={message}
            slotProps={{
              ...params.slotProps,
              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {busy && <CircularProgress size={16} aria-hidden="true" />}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
      {credit && (
        <Link
          className="gcc-currency__credit"
          href={FX_ATTRIBUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {C.attribution}
        </Link>
      )}
    </div>
  );
}
