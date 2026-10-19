/**
 * Renders one calculator piece inside the providers the Workspace gives it: the calculator
 * theme, a react-hook-form form over a real estimate, live totals from the real
 * `useLiveEstimate`, and a store whose actions are spies. Faster and more focused than mounting
 * the whole island; files using it start with `// @vitest-environment jsdom`.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo, type ReactElement, type ReactNode } from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { vi } from "vitest";
import { createEstimate, estimateSchema, type Estimate } from "@exyconn/gcc-cost";
import {
  CalculatorProvider,
  type CalculatorContextValue,
} from "../../../../src/components/gcc/calculator/state/CalculatorContext";
import type { EstimateStore } from "../../../../src/components/gcc/calculator/state/useEstimateStore";
import { useLiveEstimate } from "../../../../src/components/gcc/calculator/state/useLiveEstimate";
import type { SectionId } from "../../../../src/components/gcc/calculator/strings/sections";
import { createCalculatorTheme } from "../../../../src/components/gcc/calculator/theme";
import { DEFAULT_PRESET } from "../../lib/gcc/preset-fixture";

export const BRAND = { businessName: "Exyconn", websiteUrl: "https://exyconn.com" };
export const NOW = "2026-10-14T00:00:00.000Z";

/** A new estimate built from the CMS preset, the way a first visit creates one (three scenarios). */
export const presetEstimate = (name = "Pune GCC"): Estimate =>
  createEstimate(DEFAULT_PRESET, name, NOW);

/**
 * The preset's active scenario alone over a 12-month forecast: real roles, lines and AI inputs,
 * but computed in a fraction of the time, so live totals stay quick. The harness's default.
 */
export function liteEstimate(name = "Pune GCC"): Estimate {
  const full = presetEstimate(name);
  const scenario = full.scenarios.find((item) => item.id === full.activeScenarioId);
  if (!scenario) {
    throw new Error("The preset has no active scenario");
  }
  const assumptions = { ...scenario.assumptions, forecastMonths: 12 as const, operatingPhaseMonth: 12 };
  return { ...full, scenarios: [{ ...scenario, assumptions }] };
}

/** A store whose every action is a spy; `overrides` replaces any field. */
export function fakeStore(
  active: Estimate | null,
  overrides: Partial<EstimateStore> = {}
): EstimateStore {
  return {
    entries: active ? [{ id: active.id, name: active.name, updatedAt: active.updatedAt }] : [],
    active,
    revision: 1,
    presetOffer: null,
    dismissPresetOffer: vi.fn(),
    saveState: { kind: "idle" },
    setSaveState: vi.fn(),
    notice: null,
    dismissNotice: vi.fn(),
    create: vi.fn(),
    open: vi.fn(() => true),
    persist: vi.fn(() => NOW),
    keepTheirs: vi.fn(),
    keepMine: vi.fn(),
    remove: vi.fn(),
    duplicate: vi.fn(),
    importAsNew: vi.fn(),
    replaceActive: vi.fn(),
    ...overrides,
  } as EstimateStore;
}

export interface HarnessOptions extends Omit<RenderOptions, "wrapper"> {
  estimate?: Estimate;
  store?: Partial<EstimateStore>;
  step?: SectionId;
  scenarioIndex?: number;
  goTo?: (step: SectionId) => void;
  locale?: string;
}

export interface Harness {
  /** The form as the component sees it, filled in once the first render ran. */
  form: { current: UseFormReturn<Estimate> | null };
  store: EstimateStore;
  goTo: (step: SectionId) => void;
}

function Providers({
  estimate,
  harness,
  options,
  children,
}: Readonly<{
  estimate: Estimate;
  harness: Harness;
  options: Pick<HarnessOptions, "step" | "scenarioIndex" | "locale">;
  children: ReactNode;
}>) {
  const theme = useMemo(createCalculatorTheme, []);
  const form = useForm<Estimate>({
    defaultValues: estimate,
    resolver: zodResolver(estimateSchema),
    mode: "onTouched",
  });
  harness.form.current = form;
  const live = useLiveEstimate(form.control);
  const value = useMemo<CalculatorContextValue>(
    () => ({
      preset: DEFAULT_PRESET,
      brand: BRAND,
      store: harness.store,
      live,
      scenarioIndex: options.scenarioIndex ?? 0,
      step: options.step ?? "profile",
      goTo: harness.goTo,
      locale: options.locale ?? "en-IN",
    }),
    [harness, live, options.scenarioIndex, options.step, options.locale]
  );
  return (
    <ThemeProvider theme={theme}>
      <FormProvider {...form}>
        <CalculatorProvider value={value}>{children}</CalculatorProvider>
      </FormProvider>
    </ThemeProvider>
  );
}

/** Renders `ui` inside the calculator's providers with a user-event instance bound to it. */
export function renderInCalculator(
  ui: ReactElement,
  {
    estimate = liteEstimate(),
    store,
    step,
    scenarioIndex,
    goTo = vi.fn(),
    locale,
    ...rest
  }: HarnessOptions = {}
) {
  const harness: Harness = { form: { current: null }, store: fakeStore(estimate, store), goTo };
  const options = { step, scenarioIndex, locale };
  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Providers estimate={estimate} harness={harness} options={options}>
        {children}
      </Providers>
    );
  }
  return {
    // No delay between keystrokes: the calculator's forms are big and the suite runs in parallel.
    user: userEvent.setup({ delay: null }),
    ...render(ui, { ...rest, wrapper: Wrapper }),
    ...harness,
    estimate,
  };
}

/** Focuses a field and pastes `text`: one input event instead of one per key. */
export async function enter(
  user: ReturnType<typeof userEvent.setup>,
  field: HTMLElement,
  text: string
): Promise<void> {
  await user.click(field);
  await user.paste(text);
}
