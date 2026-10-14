import AddOutlined from "@mui/icons-material/AddOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useFieldArray, useFormContext } from "react-hook-form";
import { LIMITS, newId, type Estimate, type Role } from "@exyconn/gcc-cost";
import { useCalculator } from "../../state/CalculatorContext";
import { P } from "../../strings/people";
import { SectionShell } from "../SectionShell";
import { PayrollStats } from "./PayrollStats";
import { RoleCard } from "./RoleCard";

/** A new role starts from the first existing role's statutory settings, else from zero. */
function blankRole(department: string, template: Role | undefined): Role {
  return {
    id: newId("role"),
    department,
    title: P.newTitle,
    seniority: "mid",
    headcount: 1,
    annualGross: 0,
    costBasis: template?.costBasis ?? "gross",
    basicSharePct: template?.basicSharePct ?? 0,
    employerPfPct: template?.employerPfPct ?? 0,
    pfWageCapped: template?.pfWageCapped ?? false,
    gratuityPct: template?.gratuityPct ?? 0,
    otherStatutoryPct: template?.otherStatutoryPct ?? 0,
    benefitsAnnual: 0,
    shiftAllowanceMonthly: 0,
    incrementPct: null,
    recruitmentFeePct: template?.recruitmentFeePct ?? 0,
    hireMonth: 1,
    rampMonths: 1,
    attritionPct: null,
  };
}

/** Step 3: roles by department, compensation, statutory costs, hiring ramp and attrition. */
export function PeopleSection() {
  const { scenarioIndex, preset } = useCalculator();
  const { control, getValues } = useFormContext<Estimate>();
  const name = `scenarios.${scenarioIndex}.roles` as const;
  const { fields, append, insert, remove } = useFieldArray({ control, name, keyName: "key" });
  const departments = [
    ...new Set([...preset.departments, ...fields.map((field) => field.department)]),
  ];

  return (
    <SectionShell id="people">
      <PayrollStats />
      <Alert severity="info">{P.statutoryNote}</Alert>
      {fields.length === 0 && <p className="gcc-empty">{P.empty}</p>}
      <ol className="gcc-lines__list">
        {fields.map((field, index) => (
          <li key={field.key}>
            <RoleCard
              index={index}
              departments={departments}
              onDuplicate={() =>
                insert(index + 1, { ...getValues(`${name}.${index}`), id: newId("role") })
              }
              onRemove={() => remove(index)}
            />
          </li>
        ))}
      </ol>
      <Button
        startIcon={<AddOutlined />}
        variant="outlined"
        disabled={fields.length >= LIMITS.roles}
        onClick={() => append(blankRole(departments[0] ?? P.newTitle, getValues(`${name}.0`)))}
      >
        {P.add}
      </Button>
    </SectionShell>
  );
}
