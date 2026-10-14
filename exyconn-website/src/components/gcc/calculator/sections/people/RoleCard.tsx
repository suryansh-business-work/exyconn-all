import ContentCopy from "@mui/icons-material/ContentCopy";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useFormContext, useWatch } from "react-hook-form";
import { employeeCost, fullyLoaded, toMinor, type Estimate } from "@exyconn/gcc-cost";
import { NumberInput, SelectInput, SwitchInput, TextInput } from "../../fields";
import { useCalculator, useMoney } from "../../state/CalculatorContext";
import { F } from "../../strings/fields";
import { COST_BASIS_LABELS, optionsOf, SENIORITY_LABELS } from "../../strings/options";
import { P } from "../../strings/people";
import { UI } from "../../strings/ui";
import { Advanced } from "../SectionShell";
import { DepartmentInput } from "./DepartmentInput";

interface RoleCardProps {
  index: number;
  departments: readonly string[];
  onDuplicate: () => void;
  onRemove: () => void;
}

/** One role: a summary with its fully loaded monthly cost, expanding to every parameter. */
export function RoleCard({ index, departments, onDuplicate, onRemove }: Readonly<RoleCardProps>) {
  const { scenarioIndex, live } = useCalculator();
  const money = useMoney();
  const { control } = useFormContext<Estimate>();
  const base = `scenarios.${scenarioIndex}` as const;
  const name = `${base}.roles.${index}` as const;
  const role = useWatch({ control, name });
  const assumptions = live.estimate?.scenarios[scenarioIndex]?.assumptions;
  const loaded =
    assumptions && Number.isFinite(role.annualGross)
      ? fullyLoaded(employeeCost(role, 1, assumptions))
      : 0;
  const pct = F.units.pct;

  return (
    <Accordion
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      className="gcc-line"
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <span className="gcc-line__summary">
          <span className="gcc-line__label">
            {role.title} · {role.department}
          </span>
          <span className="gcc-line__meta">× {role.headcount}</span>
          <span className="gcc-line__amount">{P.perEmployee(money.format(toMinor(loaded)))}</span>
        </span>
      </AccordionSummary>
      <AccordionDetails>
        <div className="gcc-grid">
          <DepartmentInput name={`${name}.department`} options={departments} />
          <TextInput name={`${name}.title`} label={P.title} required />
          <SelectInput
            name={`${name}.seniority`}
            label={P.seniority}
            options={optionsOf(SENIORITY_LABELS)}
          />
          <NumberInput name={`${name}.headcount`} label={P.headcount} />
          <NumberInput name={`${name}.annualGross`} label={P.annualGross} prefix="₹" />
          <SelectInput
            name={`${name}.costBasis`}
            label={P.costBasis}
            tip={P.costBasisTip}
            options={optionsOf(COST_BASIS_LABELS)}
          />
          <NumberInput name={`${name}.hireMonth`} label={P.hireMonth} />
          <NumberInput name={`${name}.rampMonths`} label={P.ramp} unit={F.units.months} />
        </div>
        <Advanced>
          <NumberInput
            name={`${name}.basicSharePct`}
            label={P.basicShare}
            tip={P.basicShareTip}
            unit={pct}
          />
          <NumberInput
            name={`${name}.employerPfPct`}
            label={P.employerPf}
            tip={P.employerPfTip}
            unit={pct}
          />
          <NumberInput
            name={`${name}.otherStatutoryPct`}
            label={P.otherStatutory}
            tip={P.otherStatutoryTip}
            unit={pct}
          />
          <NumberInput
            name={`${name}.gratuityPct`}
            label={P.gratuity}
            tip={P.gratuityTip}
            unit={pct}
          />
          <NumberInput name={`${name}.benefitsAnnual`} label={P.benefits} prefix="₹" />
          <NumberInput name={`${name}.shiftAllowanceMonthly`} label={P.shift} prefix="₹" />
          <NumberInput
            name={`${name}.incrementPct`}
            label={P.increment}
            hint={P.incrementHint}
            unit={pct}
            nullable
          />
          <NumberInput
            name={`${name}.recruitmentFeePct`}
            label={P.recruitmentFee}
            tip={P.recruitmentFeeTip}
            unit={pct}
          />
          <NumberInput
            name={`${name}.attritionPct`}
            label={P.attrition}
            hint={P.attritionHint}
            unit={pct}
            nullable
          />
          <SwitchInput name={`${name}.pfWageCapped`} label={P.pfCapped} />
        </Advanced>
        <div className="gcc-line__tools">
          <Tooltip title={UI.common.duplicate}>
            <IconButton aria-label={`${UI.common.duplicate}: ${role.title}`} onClick={onDuplicate}>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title={UI.common.remove}>
            <IconButton aria-label={`${UI.common.remove}: ${role.title}`} onClick={onRemove}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
