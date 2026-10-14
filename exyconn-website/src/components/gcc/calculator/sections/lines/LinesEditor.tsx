import AddOutlined from "@mui/icons-material/AddOutlined";
import Button from "@mui/material/Button";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { LIMITS, newId, type CostLine, type Estimate, type LineSection } from "@exyconn/gcc-cost";
import { useCalculator } from "../../state/CalculatorContext";
import { L } from "../../strings/lines";
import { CategoryManager } from "./CategoryManager";
import { LineCard } from "./LineCard";

export function blankLine(section: LineSection, categoryId: string): CostLine {
  return {
    id: newId("line"),
    section,
    categoryId,
    label: L.newLabel,
    description: "",
    pricing: "flat",
    quantity: 1,
    unitPrice: 0,
    currency: "INR",
    ratePct: 0,
    percentBase: "operating",
    frequency: "monthly",
    startMonth: 1,
    endMonth: null,
    escalationPct: 0,
    setupFee: 0,
    taxRatePct: 0,
    applicability: "applicable",
    optional: false,
    enabled: true,
    source: { kind: "user", note: "", url: "", checkedOn: "" },
  };
}

/**
 * Every cost line of one section, edited in place inside the scenario's single `lines` array:
 * add, duplicate, reorder (among the section's own lines), delete, and the section's categories.
 */
export function LinesEditor({
  section,
  title,
}: Readonly<{ section: LineSection; title?: string }>) {
  const { scenarioIndex } = useCalculator();
  const { control, getValues, setValue } = useFormContext<Estimate>();
  const base = `scenarios.${scenarioIndex}` as const;
  const { fields, append, insert, remove, swap } = useFieldArray({
    control,
    name: `${base}.lines`,
    keyName: "key",
  });
  const categories = useWatch({ control, name: `${base}.categories` }).filter(
    (category) => category.section === section
  );
  const positions = fields
    .map((field, index) => ({ field, index }))
    .filter(({ field }) => field.section === section);

  const firstCategory = (): string => {
    if (categories[0]) {
      return categories[0].id;
    }
    const created = { id: newId("category"), section, label: L.general };
    setValue(`${base}.categories`, [...getValues(`${base}.categories`), created], {
      shouldDirty: true,
    });
    return created.id;
  };

  return (
    <div className="gcc-lines">
      {title && <h3 className="gcc-lines__title">{title}</h3>}
      <CategoryManager section={section} />
      {positions.length === 0 && <p className="gcc-empty">{L.empty}</p>}
      <ol className="gcc-lines__list">
        {positions.map(({ field, index }, order) => (
          <li key={field.key}>
            <LineCard
              index={index}
              categories={categories}
              onDuplicate={() =>
                insert(index + 1, { ...getValues(`${base}.lines.${index}`), id: newId("line") })
              }
              onRemove={() => remove(index)}
              onMoveUp={order > 0 ? () => swap(index, positions[order - 1].index) : undefined}
              onMoveDown={
                order < positions.length - 1
                  ? () => swap(index, positions[order + 1].index)
                  : undefined
              }
            />
          </li>
        ))}
      </ol>
      <Button
        startIcon={<AddOutlined />}
        variant="outlined"
        disabled={fields.length >= LIMITS.lines}
        onClick={() => append(blankLine(section, firstCategory()))}
      >
        {L.add}
      </Button>
    </div>
  );
}
