import ExpandMore from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import { COST_SECTIONS, type ScenarioSummary } from "@exyconn/gcc-cost";
import { BarList } from "../charts/BarList";
import { CurrencyPicker } from "../fields";
import { useCalculator, useMoney } from "../state/CalculatorContext";
import { COST_SECTION_LABELS } from "../strings/results";
import { UI } from "../strings/ui";

/** Section totals (setup + operating + tax) inside the forecast window. */
export function sectionBars(summary: ScenarioSummary) {
  return COST_SECTIONS.map((section) => ({
    key: section,
    label: COST_SECTION_LABELS[section],
    value: summary.byGroup
      .filter((group) => group.section === section)
      .reduce((total, group) => total + group.total, 0),
  }));
}

/**
 * The live estimate beside the form: sticky on wide screens, a compact card with an expandable
 * breakdown on phones (CSS decides which; both are the same markup).
 */
export function SummarySidebar() {
  const { live, scenarioIndex } = useCalculator();
  const money = useMoney();
  const outcome = live.outcomes[scenarioIndex] ?? live.outcomes[0];
  if (!outcome) {
    return null;
  }
  const { summary, result } = outcome;
  const perEmployee = summary.costPerEmployeeMonthly;
  const figures = [
    [UI.summary.setup, summary.setupCost],
    [UI.summary.deposits, summary.deposits],
    [UI.summary.initialCash, summary.initialCash],
    [UI.summary.monthly(summary.phaseMonth), summary.monthlyOperating],
  ] as const;
  const missing = [...new Set(result.issues.map((issue) => issue.currency))];
  return (
    <aside className="gcc-summary" aria-labelledby="gcc-summary-title" data-theme="dark">
      <h2 id="gcc-summary-title" className="gcc-summary__title">
        {UI.summary.title}
      </h2>
      <p className="gcc-summary__scenario">
        {UI.summary.scenario(result.scenario.name, summary.forecastMonths)}
      </p>
      <CurrencyPicker id="gcc-summary-currency" credit />
      <div className="gcc-summary__total" aria-live="polite">
        <span>{UI.summary.forecast}</span>
        <strong>{money.format(summary.forecastTotal)}</strong>
      </div>
      <dl className="gcc-summary__figures">
        {figures.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{money.format(value)}</dd>
          </div>
        ))}
        <div>
          <dt>{UI.summary.perEmployee}</dt>
          <dd>{perEmployee === null ? "—" : money.format(perEmployee)}</dd>
        </div>
      </dl>
      <p className="gcc-summary__note">{UI.summary.preTax}</p>
      {!live.valid && <p className="gcc-summary__stale">{UI.summary.stale}</p>}
      {missing.map((currency) => (
        <Alert key={currency} severity="warning" className="gcc-summary__alert">
          {UI.summary.missingRate(currency)}
        </Alert>
      ))}
      <Accordion
        disableGutters
        slotProps={{ transition: { unmountOnExit: true } }}
        className="gcc-summary__breakdown"
      >
        <AccordionSummary expandIcon={<ExpandMore />}>{UI.summary.breakdown}</AccordionSummary>
        <AccordionDetails>
          <BarList
            bars={sectionBars(summary)}
            format={money.compact}
            empty={UI.summary.empty}
            tone="night"
          />
        </AccordionDetails>
      </Accordion>
    </aside>
  );
}
