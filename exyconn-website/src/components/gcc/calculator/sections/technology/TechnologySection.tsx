import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { useController, useFormContext, useWatch } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { F } from "../../strings/fields";
import { T } from "../../strings/technology";
import { LinesEditor } from "../lines/LinesEditor";
import { FieldGroup, SectionShell } from "../SectionShell";
import { SubscriptionList } from "./SubscriptionList";
import { TokenUsageList } from "./TokenUsageList";

/** Step 4: fixed subscriptions, variable token usage or a budget, hardware and other technology. */
export function TechnologySection() {
  const { scenarioIndex, preset } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const ai = `scenarios.${scenarioIndex}.ai` as const;
  const { field: mode } = useController({ control, name: `${ai}.mode` });
  const rates = useWatch({ control, name: "fxRates" });
  const usage = useWatch({ control, name: `${ai}.usage` });
  const subscriptions = useWatch({ control, name: `${ai}.subscriptions` });
  const budgetCurrency = useWatch({ control, name: `${ai}.budgetCurrency` });
  const variable = mode.value === "usage" ? usage.map((item) => item.currency) : [];
  const budget = mode.value === "budget" ? [budgetCurrency] : [];
  const priced = [...variable, ...budget, ...subscriptions.map((item) => item.currency)];
  const missing = [...new Set(priced)].filter(
    (currency) => currency !== "INR" && !rates.some((rate) => rate.currency === currency)
  );
  const currencies = preset.currencies.map((code) => ({ value: code, label: code }));

  return (
    <SectionShell id="technology">
      {missing.map((currency) => (
        <Alert key={currency} severity="warning">
          {T.noRate(currency)}
        </Alert>
      ))}
      <SubscriptionList />
      <fieldset className="gcc-group">
        <FormLabel component="legend" className="gcc-group__title">
          {T.mode}
        </FormLabel>
        <RadioGroup row value={mode.value} onChange={(event) => mode.onChange(event.target.value)}>
          <FormControlLabel value="usage" control={<Radio />} label={T.modeUsage} />
          <FormControlLabel value="budget" control={<Radio />} label={T.modeBudget} />
        </RadioGroup>
        {mode.value === "budget" ? (
          <div className="gcc-grid">
            <NumberInput name={`${ai}.monthlyBudget`} label={T.budget} hint={T.budgetHint} />
            <SelectInput
              name={`${ai}.budgetCurrency`}
              label={T.budgetCurrency}
              options={currencies}
            />
          </div>
        ) : (
          <TokenUsageList />
        )}
      </fieldset>
      <FieldGroup title={T.hardware}>
        <NumberInput
          name={`${ai}.hardwarePerEmployee`}
          label={T.hardwarePerEmployee}
          tip={T.hardwareTip}
          prefix="₹"
        />
        <NumberInput
          name={`${ai}.hardwareCycleMonths`}
          label={T.hardwareCycle}
          unit={F.units.months}
        />
      </FieldGroup>
      <LinesEditor section="technology" title={T.otherTech} />
    </SectionShell>
  );
}
