import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { estimateSchema, type Estimate } from "@exyconn/gcc-cost";
import type { EstimatePath } from "../fields";
import { useCalculator } from "../state/CalculatorContext";
import { SECTIONS, type SectionId } from "../strings/sections";
import { UI } from "../strings/ui";

/** The form fields each step owns, so Next validates only what the step shows. */
export function stepFields(step: SectionId, scenario: number): EstimatePath[] {
  const s = `scenarios.${scenario}` as const;
  const map: Record<SectionId, EstimatePath[]> = {
    profile: [
      "name",
      "company",
      "reportingCurrency",
      `${s}.profile`,
      `${s}.assumptions.forecastMonths`,
    ],
    office: [`${s}.office`, `${s}.lines`],
    people: [`${s}.roles`],
    technology: [`${s}.ai`, `${s}.lines`],
    legal: [`${s}.lines`, `${s}.categories`],
    hr: [`${s}.lines`, `${s}.categories`],
    admin: [`${s}.lines`, `${s}.categories`],
    services: [`${s}.lines`, `${s}.categories`],
    assumptions: [`${s}.assumptions`, "fxRates", "scenarios", "reportingCurrency"],
    results: [],
  };
  return map[step];
}

/** Back, Next (which checks the step first) and an explicit Save. */
export function StepActions() {
  const { step, goTo, scenarioIndex, store } = useCalculator();
  const { trigger, setValue, getValues } = useFormContext<Estimate>();
  const [blocked, setBlocked] = useState(false);
  const index = SECTIONS.findIndex((section) => section.id === step);
  const previous = SECTIONS[index - 1];
  const next = SECTIONS[index + 1];

  const goNext = async () => {
    const valid = await trigger(stepFields(step, scenarioIndex), { shouldFocus: true });
    setBlocked(!valid);
    if (valid && next) {
      goTo(next.id);
    }
  };

  const saveNow = async () => {
    const valid = await trigger(undefined, { shouldFocus: true });
    const parsed = estimateSchema.safeParse(getValues());
    if (valid && parsed.success) {
      const updatedAt = store.persist(parsed.data);
      if (updatedAt) {
        setValue("updatedAt", updatedAt, { shouldDirty: false });
      }
    }
  };

  const nextLabel = next?.id === "results" ? UI.nav.results : UI.nav.next;
  return (
    <div className="gcc-actions">
      {blocked && (
        <Alert severity="error" className="gcc-actions__alert">
          {UI.nav.fixErrors}
        </Alert>
      )}
      <Button
        startIcon={<ArrowBack />}
        disabled={!previous}
        onClick={() => previous && goTo(previous.id)}
      >
        {UI.nav.back}
      </Button>
      <Button startIcon={<SaveOutlined />} variant="outlined" onClick={saveNow}>
        {UI.save.saveNow}
      </Button>
      {next && (
        <Button endIcon={<ArrowForward />} variant="contained" onClick={goNext}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
