import AddOutlined from "@mui/icons-material/AddOutlined";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { LIMITS, newId, type Estimate, type LineSection } from "@exyconn/gcc-cost";
import { NameDialog, type NameRequest } from "../../dialogs/NameDialog";
import { useCalculator } from "../../state/CalculatorContext";
import { L } from "../../strings/lines";

/**
 * The section's categories: add, rename (click a chip) and delete (only when no item uses it,
 * so no line is ever left pointing at a missing category).
 */
export function CategoryManager({ section }: Readonly<{ section: LineSection }>) {
  const { scenarioIndex } = useCalculator();
  const { control, setValue, getValues } = useFormContext<Estimate>();
  const path = `scenarios.${scenarioIndex}.categories` as const;
  const all = useWatch({ control, name: path });
  const lines = useWatch({ control, name: `scenarios.${scenarioIndex}.lines` });
  const [naming, setNaming] = useState<NameRequest | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const own = all.filter((category) => category.section === section);

  const update = (next: Estimate["scenarios"][number]["categories"]) =>
    setValue(path, next, { shouldDirty: true, shouldValidate: true });

  const add = () =>
    setNaming({
      title: L.addCategory,
      label: L.categoryName,
      initial: L.newCategory,
      submitLabel: L.addCategory,
      maxLength: 80,
      onSubmit: (label) => update([...getValues(path), { id: newId("category"), section, label }]),
    });

  const rename = (id: string, current: string) =>
    setNaming({
      title: L.renameCategory,
      label: L.categoryName,
      initial: current,
      submitLabel: L.renameCategory,
      maxLength: 80,
      onSubmit: (label) =>
        update(
          getValues(path).map((category) =>
            category.id === id ? { ...category, label } : category
          )
        ),
    });

  const removeCategory = (id: string) => {
    if (lines.some((line) => line.categoryId === id)) {
      setBlocked(id);
      return;
    }
    update(getValues(path).filter((category) => category.id !== id));
  };

  return (
    <div className="gcc-categories" aria-label={L.categories} role="group">
      {own.map((category) => (
        <Chip
          key={category.id}
          label={category.label}
          onClick={() => rename(category.id, category.label)}
          onDelete={() => removeCategory(category.id)}
          color={blocked === category.id ? "warning" : "default"}
        />
      ))}
      <Button
        size="small"
        startIcon={<AddOutlined />}
        onClick={add}
        disabled={all.length >= LIMITS.categories}
      >
        {L.addCategory}
      </Button>
      {blocked && (
        <p className="gcc-categories__note" role="alert">
          {L.categoryInUse}
        </p>
      )}
      <NameDialog request={naming} onClose={() => setNaming(null)} />
    </div>
  );
}
