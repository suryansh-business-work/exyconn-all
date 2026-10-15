import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import { useFormContext, useWatch } from "react-hook-form";
import {
  tokenCostPerMonth,
  type Estimate,
  type PricingEntry,
  type TokenUsage,
} from "@exyconn/gcc-cost";
import { NumberInput, SelectInput, TextInput } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { F } from "../../strings/fields";
import { MODEL_KIND_LABELS, optionsOf, SOURCE_KIND_LABELS } from "../../strings/options";
import { T } from "../../strings/technology";
import { UI } from "../../strings/ui";

/** True when the price list now quotes different prices than the ones saved in this row. */
function pricesDiffer(usage: TokenUsage, entries: readonly PricingEntry[]): boolean {
  const entry = entries.find(
    (item) => item.provider === usage.provider && item.model === usage.model
  );
  if (!entry || usage.source.kind !== "verified") {
    return false;
  }
  return (
    entry.inputPerMTok !== usage.inputPerMTok ||
    entry.outputPerMTok !== usage.outputPerMTok ||
    entry.cachedInputPerMTok !== usage.cachedInputPerMTok ||
    entry.currency !== usage.currency
  );
}

/** One model's prices (with their source) and monthly volumes. */
export function TokenUsageCard({
  index,
  onRemove,
}: Readonly<{ index: number; onRemove: () => void }>) {
  const { scenarioIndex, preset, locale } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.ai.usage.${index}` as const;
  const usage = useWatch({ control, name });
  const pct = F.units.pct;
  const currencies = [...new Set([...preset.currencies, usage.currency])].map((code) => ({
    value: code,
    label: code,
  }));
  const monthly = Number.isFinite(tokenCostPerMonth(usage)) ? tokenCostPerMonth(usage) : 0;
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: usage.currency,
  }).format(monthly);

  return (
    <div className="gcc-card">
      <div className="gcc-card__head">
        <strong>
          {usage.provider} · {usage.model}
        </strong>
        <span>{T.monthly(price)}</span>
        <IconButton aria-label={`${UI.common.remove}: ${usage.model}`} onClick={onRemove}>
          <DeleteOutlined />
        </IconButton>
      </div>
      <p className="gcc-card__source">
        {SOURCE_KIND_LABELS[usage.source.kind]} — {usage.source.note}{" "}
        {usage.source.url && (
          <Link href={usage.source.url} target="_blank" rel="noopener noreferrer">
            {usage.source.url}
          </Link>
        )}
      </p>
      {pricesDiffer(usage, preset.pricing) && <Alert severity="info">{T.catalogueChanged}</Alert>}
      <div className="gcc-grid">
        <TextInput name={`${name}.provider`} label={T.provider} required />
        <TextInput name={`${name}.model`} label={T.model} required />
        <SelectInput name={`${name}.kind`} label={T.kind} options={optionsOf(MODEL_KIND_LABELS)} />
        <SelectInput name={`${name}.currency`} label={T.currency} options={currencies} />
        <NumberInput name={`${name}.inputPerMTok`} label={T.inputPrice} />
        <NumberInput name={`${name}.outputPerMTok`} label={T.outputPrice} />
        <NumberInput name={`${name}.cachedInputPerMTok`} label={T.cachedPrice} />
        <NumberInput name={`${name}.batchDiscountPct`} label={T.batchDiscount} unit={pct} />
        <NumberInput name={`${name}.inputMTokMonthly`} label={T.inputVolume} />
        <NumberInput name={`${name}.outputMTokMonthly`} label={T.outputVolume} />
        <NumberInput name={`${name}.cachedInputMTokMonthly`} label={T.cachedVolume} />
        <NumberInput name={`${name}.batchSharePct`} label={T.batchShare} unit={pct} />
        <NumberInput name={`${name}.startMonth`} label={T.startMonth} />
      </div>
    </div>
  );
}
