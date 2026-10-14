import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useFieldArray, useFormContext } from "react-hook-form";
import { LIMITS, newId, type Estimate } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput, TextInput } from "../../fields";
import { useCalculator } from "../../state/CalculatorContext";
import { T } from "../../strings/technology";
import { UI } from "../../strings/ui";

/** Fixed per-user AI subscriptions: provider, plan, price, users, start month. */
export function SubscriptionList() {
  const { scenarioIndex, preset } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.ai.subscriptions` as const;
  const { fields, append, remove } = useFieldArray({ control, name, keyName: "key" });
  const currencies = preset.currencies.map((code) => ({ value: code, label: code }));
  return (
    <fieldset className="gcc-group">
      <legend className="gcc-group__title">{T.subscriptions}</legend>
      {fields.map((field, index) => (
        <div key={field.key} className="gcc-card">
          <div className="gcc-grid">
            <TextInput name={`${name}.${index}.provider`} label={T.provider} required />
            <TextInput name={`${name}.${index}.plan`} label={T.plan} />
            <NumberInput name={`${name}.${index}.pricePerUserMonthly`} label={T.pricePerUser} />
            <SelectInput
              name={`${name}.${index}.currency`}
              label={T.currency}
              options={currencies}
            />
            <NumberInput name={`${name}.${index}.users`} label={T.users} />
            <NumberInput name={`${name}.${index}.startMonth`} label={T.startMonth} />
          </div>
          <IconButton
            aria-label={`${UI.common.remove}: ${field.provider}`}
            onClick={() => remove(index)}
          >
            <DeleteOutlined />
          </IconButton>
        </div>
      ))}
      <Button
        startIcon={<AddOutlined />}
        disabled={fields.length >= LIMITS.subscriptions}
        onClick={() =>
          append({
            id: newId("subscription"),
            provider: T.provider,
            plan: "",
            pricePerUserMonthly: 0,
            currency: "INR",
            users: 1,
            startMonth: 1,
          })
        }
      >
        {T.addSubscription}
      </Button>
    </fieldset>
  );
}
