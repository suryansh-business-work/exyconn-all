import { ResultsSection } from "../results/ResultsSection";
import { useCalculator } from "../state/CalculatorContext";
import type { SectionId } from "../strings/sections";
import { AssumptionsSection } from "./assumptions/AssumptionsSection";
import { LinesStep } from "./LinesStep";
import { OfficeSection } from "./OfficeSection";
import { PeopleSection } from "./people/PeopleSection";
import { ProfileSection } from "./ProfileSection";
import { TechnologySection } from "./technology/TechnologySection";

function Step({ step }: Readonly<{ step: SectionId }>) {
  switch (step) {
    case "office":
      return <OfficeSection />;
    case "people":
      return <PeopleSection />;
    case "technology":
      return <TechnologySection />;
    case "legal":
    case "hr":
    case "admin":
    case "services":
      return <LinesStep id={step} />;
    case "assumptions":
      return <AssumptionsSection />;
    case "results":
      return <ResultsSection />;
    default:
      return <ProfileSection />;
  }
}

/**
 * The open step's editor. Keyed by scenario so switching scenario remounts the field arrays on
 * the new scenario's paths instead of carrying the old one's rows across.
 */
export function SectionPanel() {
  const { step, scenarioIndex } = useCalculator();
  return <Step key={`${step}:${scenarioIndex}`} step={step} />;
}
