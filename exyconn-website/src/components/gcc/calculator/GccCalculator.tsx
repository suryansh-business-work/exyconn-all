import CircularProgress from "@mui/material/CircularProgress";
import { ThemeProvider } from "@mui/material/styles";
import { useMemo } from "react";
import type { CalculatorPreset } from "@exyconn/gcc-cost";
import { SharedEstimateView } from "./share/SharedEstimateView";
import { UI } from "./strings/ui";
import { useEstimateStore } from "./state/useEstimateStore";
import { createCalculatorTheme } from "./theme";
import { Workspace } from "./Workspace";
import "./calculator.css";

/** Admin › Branding, for the PDF report and the share text. */
export interface Brand {
  businessName: string;
  websiteUrl: string;
}

export type GccCalculatorProps = Readonly<{ preset: CalculatorPreset; brand: Brand }>;

/** `?preset=lean` picks the scenario a new estimate opens on; `#share=<token>` opens a shared one. */
function readLocation() {
  const { search, hash } = globalThis.location;
  return {
    presetScenario: new URLSearchParams(search).get("preset"),
    shareToken: new URLSearchParams(hash.slice(1)).get("share"),
  };
}

function LocalCalculator({
  preset,
  brand,
  presetScenario,
}: Readonly<{ preset: CalculatorPreset; brand: Brand; presetScenario: string | null }>) {
  const store = useEstimateStore(preset, presetScenario);
  if (!store.active) {
    return (
      <div className="gcc-loading" role="status">
        <CircularProgress size={20} aria-hidden="true" />
        <span>{UI.loading}</span>
      </div>
    );
  }
  return <Workspace key={store.revision} preset={preset} brand={brand} store={store} />;
}

/** The GCC cost calculator island (client-only: it reads this browser's saved estimates). */
export default function GccCalculator({ preset, brand }: GccCalculatorProps) {
  const theme = useMemo(createCalculatorTheme, []);
  const { presetScenario, shareToken } = useMemo(readLocation, []);
  return (
    <ThemeProvider theme={theme}>
      <div className="gcc-app">
        {shareToken ? (
          <SharedEstimateView token={shareToken} preset={preset} brand={brand} />
        ) : (
          <LocalCalculator preset={preset} brand={brand} presetScenario={presetScenario} />
        )}
      </div>
    </ThemeProvider>
  );
}
