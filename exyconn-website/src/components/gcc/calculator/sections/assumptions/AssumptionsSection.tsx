import Alert from "@mui/material/Alert";
import { FORECAST_MONTHS } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { A } from "../../strings/assumptions";
import { F } from "../../strings/fields";
import { optionsOf, PAYMENT_TIMING_LABELS } from "../../strings/options";
import { FieldGroup, SectionShell } from "../SectionShell";
import { FxRates } from "./FxRates";
import { ScenarioManager } from "./ScenarioManager";

const FORECAST_OPTIONS = FORECAST_MONTHS.map((value) => ({
  value,
  label: F.profile.months(value),
}));

/** Step 9: forecast window, escalation, contingency, cash, taxes, optional analysis, rates, scenarios. */
export function AssumptionsSection() {
  const { scenarioIndex } = useCalculator();
  const a = `scenarios.${scenarioIndex}.assumptions` as const;
  const pct = F.units.pct;
  return (
    <SectionShell id="assumptions">
      <Alert severity="info">{A.illustrative}</Alert>
      <ScenarioManager />
      <FieldGroup title={A.forecast}>
        <SelectInput
          name={`${a}.forecastMonths`}
          label={A.forecastMonths}
          options={FORECAST_OPTIONS}
        />
        <NumberInput name={`${a}.operatingPhaseMonth`} label={A.phaseMonth} tip={A.phaseTip} />
      </FieldGroup>
      <FieldGroup title={A.escalation}>
        <NumberInput name={`${a}.salaryInflationPct`} label={A.salaryInflation} unit={pct} />
        <NumberInput
          name={`scenarios.${scenarioIndex}.office.rentEscalationPct`}
          label={A.rentEscalation}
          unit={pct}
        />
        <NumberInput name={`${a}.techGrowthPct`} label={A.techGrowth} unit={pct} />
        <NumberInput name={`${a}.attritionPct`} label={A.attrition} unit={pct} />
      </FieldGroup>
      <FieldGroup title={A.finance}>
        <NumberInput
          name={`${a}.contingencyPct`}
          label={A.contingency}
          tip={A.contingencyTip}
          unit={pct}
        />
        <NumberInput
          name={`${a}.workingCapitalMonths`}
          label={A.workingCapital}
          tip={A.workingCapitalTip}
          unit={F.units.months}
        />
        <SelectInput
          name={`${a}.paymentTiming`}
          label={A.paymentTiming}
          options={optionsOf(PAYMENT_TIMING_LABELS)}
        />
        <NumberInput name={`${a}.officeTaxPct`} label={A.officeTax} tip={A.taxTip} unit={pct} />
        <NumberInput
          name={`${a}.technologyTaxPct`}
          label={A.technologyTax}
          tip={A.taxTip}
          unit={pct}
        />
        <NumberInput name={`${a}.pfWageCeilingMonthly`} label={A.pfCeiling} prefix="₹" />
      </FieldGroup>
      <FieldGroup title={A.analysis}>
        <NumberInput
          name={`${a}.discountRatePct`}
          label={A.discountRate}
          hint={A.discountHint}
          unit={pct}
          nullable
        />
        <NumberInput
          name={`${a}.monthlyBenefit`}
          label={A.benefit}
          hint={A.benefitHint}
          prefix="₹"
          nullable
        />
      </FieldGroup>
      <FxRates />
    </SectionShell>
  );
}
