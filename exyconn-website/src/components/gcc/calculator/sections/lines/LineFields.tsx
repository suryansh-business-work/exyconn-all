import Alert from "@mui/material/Alert";
import type { Category, CostLine } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput, SwitchInput, TextInput, type EstimatePath } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { F } from "../../strings/fields";
import { L } from "../../strings/lines";
import {
  APPLICABILITY_LABELS,
  FREQUENCY_LABELS,
  optionsOf,
  PERCENT_BASE_LABELS,
  PRICING_LABELS,
  SOURCE_KIND_LABELS,
} from "../../strings/options";
import { Advanced } from "../SectionShell";

type LinePath = `scenarios.${number}.lines.${number}`;

/** The pricing inputs that apply to the chosen pricing rule. */
function PricingFields({ name, line }: Readonly<{ name: LinePath; line: CostLine }>) {
  const { preset } = useCalculator();
  if (line.pricing === "percentage") {
    return (
      <>
        <NumberInput name={`${name}.ratePct`} label={L.ratePct} unit={F.units.pct} />
        <SelectInput
          name={`${name}.percentBase`}
          label={L.percentBase}
          options={optionsOf(PERCENT_BASE_LABELS)}
        />
      </>
    );
  }
  const currencies = preset.currencies.map((code) => ({ value: code, label: code }));
  return (
    <>
      <NumberInput name={`${name}.quantity`} label={L.quantity} />
      <NumberInput name={`${name}.unitPrice`} label={L.unitPrice} />
      <SelectInput name={`${name}.currency`} label={L.currency} options={currencies} />
      {line.pricing !== "per-hire" && (
        <SelectInput
          name={`${name}.frequency`}
          label={L.frequency}
          options={optionsOf(FREQUENCY_LABELS)}
        />
      )}
    </>
  );
}

/** Every parameter of a cost line; schedule, tax and source sit under advanced settings. */
export function LineFields({
  name,
  line,
  categories,
}: Readonly<{ name: LinePath; line: CostLine; categories: readonly Category[] }>) {
  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.label,
  }));
  const field = (key: string) => `${name}.${key}` as EstimatePath;
  return (
    <div className="gcc-line__fields">
      <div className="gcc-grid">
        <TextInput name={field("label")} label={L.label} required />
        <SelectInput name={field("categoryId")} label={L.category} options={categoryOptions} />
        <SelectInput
          name={field("pricing")}
          label={L.pricing}
          tip={L.pricingTip}
          options={optionsOf(PRICING_LABELS)}
        />
        <PricingFields name={name} line={line} />
        <SelectInput
          name={field("applicability")}
          label={L.applicability}
          options={optionsOf(APPLICABILITY_LABELS)}
        />
      </div>
      {line.applicability === "review" && <Alert severity="warning">{L.reviewWarning}</Alert>}
      <div className="gcc-switches">
        <SwitchInput name={field("enabled")} label={L.enabled} />
        <SwitchInput name={field("optional")} label={L.optional} />
      </div>
      <Advanced>
        <TextInput name={field("description")} label={L.description} multiline />
        <NumberInput name={field("startMonth")} label={L.startMonth} />
        <NumberInput name={field("endMonth")} label={L.endMonth} hint={L.endHint} nullable />
        <NumberInput name={field("escalationPct")} label={L.escalation} unit={F.units.pct} />
        <NumberInput name={field("setupFee")} label={L.setupFee} tip={L.setupFeeTip} />
        <NumberInput
          name={field("taxRatePct")}
          label={L.taxRate}
          tip={L.taxTip}
          unit={F.units.pct}
        />
        <SelectInput
          name={field("source.kind")}
          label={L.sourceKind}
          options={optionsOf(SOURCE_KIND_LABELS)}
        />
        <TextInput name={field("source.note")} label={L.sourceNote} />
        <TextInput name={field("source.url")} label={L.sourceUrl} />
      </Advanced>
    </div>
  );
}
