import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useFormContext, useWatch } from "react-hook-form";
import { FORECAST_MONTHS, type Estimate } from "@exyconn/gcc-cost";
import { DateInput, NumberInput, SelectInput, TextInput } from "../fields";
import { useCalculator } from "../state/CalculatorContext";
import { F } from "../strings/fields";
import {
  OPERATING_MODEL_HINTS,
  OPERATING_MODEL_LABELS,
  optionsOf,
  SHIFT_LABELS,
  WORKING_MODEL_LABELS,
} from "../strings/options";
import { FieldGroup, SectionShell } from "./SectionShell";

const P = F.profile;
const FORECAST_OPTIONS = FORECAST_MONTHS.map((value) => ({ value, label: P.months(value) }));

/** Step 1: the company, the centre's purpose and model, headcount targets and reporting basics. */
export function ProfileSection() {
  const { scenarioIndex, preset, goTo } = useCalculator();
  const s = `scenarios.${scenarioIndex}` as const;
  const { control } = useFormContext<Estimate>();
  const model = useWatch({ control, name: `${s}.profile.operatingModel` });
  const currency = useWatch({ control, name: "reportingCurrency" });
  const rates = useWatch({ control, name: "fxRates" });
  const roles = useWatch({ control, name: `${s}.roles` });
  const target = useWatch({ control, name: `${s}.profile.targetHeadcountYear3` });
  const rosterSize = roles.reduce((total, role) => total + (role.headcount || 0), 0);
  const missingRate = currency !== "INR" && !rates.some((rate) => rate.currency === currency);
  const currencies = preset.currencies.map((code) => ({ value: code, label: code }));

  return (
    <SectionShell id="profile">
      <FieldGroup title={P.company}>
        <TextInput name="name" label={P.name} required />
        <TextInput name="company.companyName" label={P.companyName} />
        <TextInput name="company.parentCountry" label={P.parentCountry} />
        <TextInput name="company.industry" label={P.industry} />
        <TextInput name="company.purpose" label={P.purpose} hint={P.purposeHint} />
      </FieldGroup>
      <FieldGroup title={P.centre}>
        <SelectInput
          name={`${s}.profile.operatingModel`}
          label={P.operatingModel}
          tip={P.operatingModelTip}
          hint={OPERATING_MODEL_HINTS[model]}
          options={optionsOf(OPERATING_MODEL_LABELS)}
        />
        <DateInput name={`${s}.profile.launchDate`} label={P.launchDate} />
        <TextInput
          name={`${s}.profile.launchTimeline`}
          label={P.launchTimeline}
          hint={P.launchTimelineHint}
        />
        <NumberInput name={`${s}.profile.initialHeadcount`} label={P.initialHeadcount} />
        <NumberInput
          name={`${s}.profile.targetHeadcountYear3`}
          label={P.targetHeadcount}
          hint={P.targetHint}
        />
        <SelectInput
          name={`${s}.profile.workingModel`}
          label={P.workingModel}
          options={optionsOf(WORKING_MODEL_LABELS)}
        />
        <SelectInput
          name={`${s}.profile.shiftPattern`}
          label={P.shiftPattern}
          options={optionsOf(SHIFT_LABELS)}
        />
        <SelectInput
          name="reportingCurrency"
          label={P.reportingCurrency}
          hint={P.reportingCurrencyHint}
          options={currencies}
        />
        <SelectInput
          name={`${s}.assumptions.forecastMonths`}
          label={P.forecastMonths}
          options={FORECAST_OPTIONS}
        />
      </FieldGroup>
      {missingRate && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={() => goTo("assumptions")}>
              {P.goToRates}
            </Button>
          }
        >
          {P.needRate(currency)}
        </Alert>
      )}
      {target > 0 && rosterSize !== target && (
        <Alert severity="info">{P.rosterGap(rosterSize, target)}</Alert>
      )}
    </SectionShell>
  );
}
