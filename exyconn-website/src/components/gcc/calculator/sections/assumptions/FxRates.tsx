import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import SyncOutlined from "@mui/icons-material/SyncOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useState } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { LIMITS, type Estimate, type FxRate } from "@exyconn/gcc-cost";
import { fetchFxRates } from "../../../../../lib/gcc/api";
import { DateInput, NumberInput, SelectInput, SwitchInput, TextInput } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { useCurrencyOptions } from "../../state/useCurrencyOptions";
import { FX_ATTRIBUTION_URL } from "../../../../../lib/gcc/fx-attribution";
import Link from "@mui/material/Link";
import { A } from "../../strings/assumptions";
import { UI } from "../../strings/ui";

type Status =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; text: string }
  | { kind: "failed"; text: string };

/** "USD 83.1 → 84.0" lines, so a refresh never changes a saved rate without saying so. */
function describeChanges(previous: readonly FxRate[], next: readonly FxRate[]): string {
  return next
    .map((rate) => {
      const old = previous.find((entry) => entry.currency === rate.currency);
      return old
        ? A.change(rate.currency, String(old.inrPerUnit), String(rate.inrPerUnit))
        : A.added(rate.currency, String(rate.inrPerUnit));
    })
    .join(", ");
}

/** The estimate's exchange rates: entered by hand, or refreshed from the reference-rate service. */
export function FxRates() {
  const { preset } = useCalculator();
  const { control, getValues, setValue } = useFormContext<Estimate>();
  const { fields, append, remove } = useFieldArray({ control, name: "fxRates", keyName: "key" });
  const reporting = useWatch({ control, name: "reportingCurrency" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const foreign = preset.currencies.filter((code) => code !== "INR");
  const choices = useCurrencyOptions(fields.map((field) => field.currency));
  const options = choices
    .filter((choice) => choice.code !== "INR")
    .map((choice) => ({ value: choice.code, label: choice.label }));

  const refresh = async () => {
    setStatus({ kind: "busy" });
    const wanted = [
      ...new Set([
        ...getValues("fxRates").map((rate) => rate.currency),
        ...(reporting === "INR" ? [] : [reporting]),
      ]),
    ];
    const result = await fetchFxRates(wanted.length > 0 ? wanted : foreign);
    if (!result.ok) {
      setStatus({ kind: "failed", text: A.fetchFailed(result.message) });
      return;
    }
    const previous = getValues("fxRates");
    const merged = [
      ...previous.filter((rate) => !result.rates.some((next) => next.currency === rate.currency)),
      ...result.rates,
    ];
    setValue("fxRates", merged, { shouldDirty: true, shouldValidate: true });
    setStatus({ kind: "done", text: A.fetched(describeChanges(previous, result.rates)) });
  };

  const unused = foreign.find((code) => !fields.some((field) => field.currency === code));
  return (
    <fieldset className="gcc-group">
      <legend className="gcc-group__title">{A.rates}</legend>
      <p className="gcc-lines__note">
        {A.ratesNote}{" "}
        <Link href={FX_ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
          {UI.currency.attribution}
        </Link>
      </p>
      {fields.map((field, index) => (
        <div key={field.key} className="gcc-card">
          <div className="gcc-grid">
            <SelectInput name={`fxRates.${index}.currency`} label={A.currency} options={options} />
            <NumberInput
              name={`fxRates.${index}.inrPerUnit`}
              label={A.inrPerUnit(field.currency)}
            />
            <TextInput name={`fxRates.${index}.source`} label={A.source} />
            <DateInput name={`fxRates.${index}.asOf`} label={A.asOf} />
            <SwitchInput name={`fxRates.${index}.userProvided`} label={A.userProvided} />
          </div>
          <IconButton
            aria-label={`${UI.common.remove}: ${field.currency}`}
            onClick={() => remove(index)}
          >
            <DeleteOutlined />
          </IconButton>
        </div>
      ))}
      {status.kind === "done" && <Alert severity="success">{status.text}</Alert>}
      {status.kind === "failed" && <Alert severity="warning">{status.text}</Alert>}
      <div className="gcc-row">
        <Button
          startIcon={<AddOutlined />}
          disabled={!unused || fields.length >= LIMITS.currencies}
          onClick={() =>
            unused &&
            // Starts empty (NaN): the field asks for a rate instead of assuming one.
            append({
              currency: unused,
              inrPerUnit: Number.NaN,
              source: A.manualSource,
              asOf: "",
              userProvided: true,
            })
          }
        >
          {A.addRate}
        </Button>
        <Button
          startIcon={<SyncOutlined />}
          variant="outlined"
          disabled={status.kind === "busy"}
          onClick={refresh}
        >
          {status.kind === "busy" ? A.fetching : A.fetch}
        </Button>
      </div>
    </fieldset>
  );
}
