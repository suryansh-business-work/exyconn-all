import Alert from "@mui/material/Alert";
import { useCalculator } from "../state/CalculatorContext";
import type { SectionId } from "../strings/sections";
import { HiringStats } from "./HiringStats";
import { LinesEditor } from "./lines/LinesEditor";
import { SectionShell } from "./SectionShell";

const NOTES: Partial<Record<SectionId, string>> = {
  legal:
    "Estimates only, not legal or tax advice. Entity, tax, transfer-pricing and FEMA requirements depend on your structure and jurisdiction — mark uncertain items as requiring professional review.",
  services:
    "Exyconn services are optional and quoted on request: enter a figure once you have a quote, or leave them at zero. Add any other parameter you need as a custom item.",
};

type LineStepId = "legal" | "hr" | "admin" | "services";

/** Steps 5–8: the section's cost items (legal, HR, admin, Exyconn services and custom items). */
export function LinesStep({ id }: Readonly<{ id: LineStepId }>) {
  const { scenarioIndex } = useCalculator();
  const note = NOTES[id];
  return (
    <SectionShell id={id}>
      {note && <Alert severity="info">{note}</Alert>}
      {id === "hr" && <HiringStats key={scenarioIndex} />}
      <LinesEditor section={id} />
    </SectionShell>
  );
}
