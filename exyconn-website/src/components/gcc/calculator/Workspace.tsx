import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { estimateSchema, type CalculatorPreset, type Estimate } from "@exyconn/gcc-cost";
import { EstimateBar } from "./layout/EstimateBar";
import { SectionNav } from "./layout/SectionNav";
import { StepActions } from "./layout/StepActions";
import { SummarySidebar } from "./layout/SummarySidebar";
import type { Brand } from "./GccCalculator";
import { SectionPanel } from "./sections/SectionPanel";
import {
  CalculatorProvider,
  readerLocale,
  type CalculatorContextValue,
} from "./state/CalculatorContext";
import { useAutosave } from "./state/useAutosave";
import type { EstimateStore } from "./state/useEstimateStore";
import { useLiveEstimate } from "./state/useLiveEstimate";
import { SECTIONS, type SectionId } from "./strings/sections";

const STEP_IDS = new Set<string>(SECTIONS.map((section) => section.id));

function initialStep(): SectionId {
  const step = new URLSearchParams(globalThis.location.hash.slice(1)).get("step") ?? "";
  return STEP_IDS.has(step) ? (step as SectionId) : "profile";
}

/** Keeps the step in the URL fragment (never anything confidential) so a reload stays put. */
function writeStep(step: SectionId) {
  globalThis.history.replaceState(null, "", `#step=${step}`);
}

interface WorkspaceProps {
  preset: CalculatorPreset;
  brand: Brand;
  store: EstimateStore;
}

/** One estimate being edited: the form, live totals, autosave, the steps and the summary. */
export function Workspace({ preset, brand, store }: Readonly<WorkspaceProps>) {
  const form = useForm<Estimate>({
    defaultValues: store.active ?? undefined,
    resolver: zodResolver(estimateSchema),
    mode: "onTouched",
  });
  const live = useLiveEstimate(form.control);
  useAutosave(form, live, store);
  const [step, setStep] = useState<SectionId>(initialStep);
  const activeScenarioId = useWatch({ control: form.control, name: "activeScenarioId" });
  const scenarios = useWatch({ control: form.control, name: "scenarios" });
  const scenarioIndex = Math.max(
    0,
    scenarios.findIndex((scenario) => scenario.id === activeScenarioId)
  );

  const goTo = useCallback((next: SectionId) => {
    setStep(next);
    writeStep(next);
    globalThis.requestAnimationFrame(() => {
      document.getElementById(`gcc-step-${next}`)?.focus();
    });
  }, []);

  const value = useMemo<CalculatorContextValue>(
    () => ({ preset, brand, store, live, scenarioIndex, step, goTo, locale: readerLocale() }),
    [preset, brand, store, live, scenarioIndex, step, goTo]
  );

  return (
    <FormProvider {...form}>
      <CalculatorProvider value={value}>
        <EstimateBar />
        <div className="gcc-workspace">
          <div className="gcc-workspace__main">
            <SectionNav />
            <form
              noValidate
              aria-labelledby={`gcc-step-${step}`}
              onSubmit={(event) => event.preventDefault()}
            >
              <SectionPanel />
              <StepActions />
            </form>
          </div>
          <SummarySidebar />
        </div>
      </CalculatorProvider>
    </FormProvider>
  );
}
