import AddOutlined from "@mui/icons-material/AddOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useFieldArray, useFormContext } from "react-hook-form";
import { LIMITS, newId, type Estimate } from "@exyconn/gcc-cost";
import { NumberInput } from "../fields";
import { useCalculator } from "../state/CalculatorContext";
import { F } from "../strings/fields";
import { UI } from "../strings/ui";

const O = F.office;

/** Seats added later in the forecast; each brings its own fit-out and deposit in its month. */
export function OfficeExpansions() {
  const { scenarioIndex } = useCalculator();
  const { control } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.office.expansions` as const;
  const { fields, append, remove } = useFieldArray({ control, name, keyName: "key" });
  return (
    <fieldset className="gcc-group">
      <legend className="gcc-group__title">{O.expansions}</legend>
      {fields.map((field, index) => (
        <div key={field.key} className="gcc-row">
          <NumberInput name={`${name}.${index}.month`} label={O.expansionMonth} />
          <NumberInput name={`${name}.${index}.seats`} label={O.expansionSeats} />
          <IconButton
            aria-label={`${UI.common.remove} ${O.expansions}`}
            onClick={() => remove(index)}
          >
            <DeleteOutlined />
          </IconButton>
        </div>
      ))}
      <Button
        startIcon={<AddOutlined />}
        disabled={fields.length >= LIMITS.expansions}
        onClick={() => append({ id: newId("expansion"), month: 13, seats: 10 })}
      >
        {O.addExpansion}
      </Button>
    </fieldset>
  );
}
