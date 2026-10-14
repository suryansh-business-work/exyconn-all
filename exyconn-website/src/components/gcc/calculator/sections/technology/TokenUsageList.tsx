import AddOutlined from "@mui/icons-material/AddOutlined";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  LIMITS,
  newId,
  type Estimate,
  type PricingEntry,
  type TokenUsage,
} from "@exyconn/gcc-cost";
import { useCalculator } from "../../state/CalculatorContext";
import { T } from "../../strings/technology";
import { TokenUsageCard } from "./TokenUsageCard";

/** A usage row priced from a price-list entry; the prices and their source are copied in. */
function fromEntry(entry: PricingEntry): TokenUsage {
  return {
    id: newId("usage"),
    provider: entry.provider,
    model: entry.model,
    kind: entry.kind,
    currency: entry.currency,
    inputPerMTok: entry.inputPerMTok,
    outputPerMTok: entry.outputPerMTok,
    cachedInputPerMTok: entry.cachedInputPerMTok,
    batchDiscountPct: entry.batchDiscountPct,
    inputMTokMonthly: 0,
    outputMTokMonthly: 0,
    cachedInputMTokMonthly: 0,
    batchSharePct: 0,
    startMonth: 1,
    source: { ...entry.source, note: T.pricingSource(entry.effectiveDate, entry.source.checkedOn) },
  };
}

function customUsage(): TokenUsage {
  return {
    ...fromEntry({
      id: "custom",
      provider: T.provider,
      model: T.model,
      kind: "chat",
      currency: "USD",
      inputPerMTok: 0,
      outputPerMTok: 0,
      cachedInputPerMTok: 0,
      batchDiscountPct: 0,
      effectiveDate: "",
      source: { kind: "user", note: "", url: "", checkedOn: "" },
    }),
    source: { kind: "user", note: T.customSource, url: "", checkedOn: "" },
  };
}

/** Token usage per model: add one from the verified price list, or a custom model with your own prices. */
export function TokenUsageList() {
  const { scenarioIndex, preset } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.ai.usage` as const;
  const { fields, append, remove } = useFieldArray({ control, name, keyName: "key" });
  const [picked, setPicked] = useState(preset.pricing[0]?.id ?? "");
  const full = fields.length >= LIMITS.subscriptions;
  const entry = preset.pricing.find((item) => item.id === picked);

  return (
    <div className="gcc-lines">
      <h3 className="gcc-lines__title">{T.usage}</h3>
      <p className="gcc-lines__note">{T.usageTip}</p>
      {fields.map((field, index) => (
        <TokenUsageCard key={field.key} index={index} onRemove={() => remove(index)} />
      ))}
      <div className="gcc-row">
        {preset.pricing.length > 0 && (
          <>
            <TextField
              select
              label={T.pickModel}
              value={picked}
              onChange={(event) => setPicked(event.target.value)}
            >
              {preset.pricing.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.provider} · {item.model}
                </MenuItem>
              ))}
            </TextField>
            <Button
              startIcon={<AddOutlined />}
              variant="outlined"
              disabled={full || !entry}
              onClick={() => entry && append(fromEntry(entry))}
            >
              {T.addModel}
            </Button>
          </>
        )}
        <Button startIcon={<AddOutlined />} disabled={full} onClick={() => append(customUsage())}>
          {T.addCustomModel}
        </Button>
      </div>
    </div>
  );
}
