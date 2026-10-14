import type { ReactNode } from "react";
import { departmentTotals } from "@exyconn/gcc-cost";
import { BarList } from "../charts/BarList";
import { TimelineChart } from "../charts/TimelineChart";
import { sectionBars } from "../layout/SummarySidebar";
import { SectionShell } from "../sections/SectionShell";
import { useCalculator, useMoney } from "../state/CalculatorContext";
import { RESULTS } from "../strings/results";
import { UI } from "../strings/ui";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ExportActions } from "./ExportActions";
import { HeadlineFigures } from "./HeadlineFigures";
import { ScenarioComparison } from "./ScenarioComparison";

function Panel({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="gcc-panel">
      <h3 className="gcc-panel__title">{title}</h3>
      {children}
    </section>
  );
}

/** Step 10: the estimate, its breakdowns and comparison, then export, sharing and consultation. */
export function ResultsSection() {
  const { live, scenarioIndex, locale } = useCalculator();
  const money = useMoney();
  const outcome = live.outcomes[scenarioIndex];
  if (!outcome) {
    return (
      <SectionShell id="results">
        <p className="gcc-empty">{UI.summary.empty}</p>
      </SectionShell>
    );
  }
  const { summary, result } = outcome;
  const departments = departmentTotals(summary).map((group) => ({
    key: group.key,
    label: group.group,
    value: group.total,
  }));
  const technology = summary.byItem
    .filter((item) => item.section === "technology")
    .map((item) => ({ key: item.key, label: item.label, value: item.total }));

  return (
    <SectionShell id="results">
      <HeadlineFigures
        summary={summary}
        hasBenefit={result.scenario.assumptions.monthlyBenefit !== null}
      />
      <div className="gcc-panels">
        <Panel title={RESULTS.byCategory}>
          <BarList bars={sectionBars(summary)} format={money.format} empty={UI.summary.empty} />
        </Panel>
        <Panel title={RESULTS.byDepartment}>
          <BarList bars={departments} format={money.format} empty={RESULTS.departmentsEmpty} />
        </Panel>
        <Panel title={RESULTS.technology}>
          <BarList bars={technology} format={money.format} empty={RESULTS.technologyEmpty} />
        </Panel>
        <Panel title={RESULTS.annual}>
          <BarList
            bars={summary.annualOperating.map((value, index) => ({
              key: `year-${index + 1}`,
              label: RESULTS.year(index + 1),
              value,
            }))}
            format={money.format}
            empty={UI.summary.empty}
          />
        </Panel>
      </div>
      <Panel title={RESULTS.timeline}>
        <TimelineChart
          months={result.months.slice(0, summary.forecastMonths)}
          format={money.format}
          locale={locale}
        />
      </Panel>
      <Panel title={RESULTS.comparison}>
        <ScenarioComparison />
      </Panel>
      <AssumptionsPanel summary={summary} />
      <ExportActions />
    </SectionShell>
  );
}
