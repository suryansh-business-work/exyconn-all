import { useCalculator } from "../state/CalculatorContext";

const STATS = {
  title: "Recruitment plan (from your roles)",
  newHires: "New positions to fill in the forecast",
  backfills: "Attrition backfills in the forecast",
  peak: "Busiest hiring month",
  timeline: "Hiring runs from month",
  none: "Add roles in Employees & payroll to see the hiring plan.",
  month: (month: number, hires: string) => `Month ${month} (${hires} hires)`,
  range: (from: number, to: number) => `${from} to ${to}`,
} as const;

/**
 * The recruitment target, monthly hiring peak and timeline derived from the headcount plan, so
 * per-hire HR costs below can be checked against the volume they multiply.
 */
export function HiringStats() {
  const { live, scenarioIndex, locale } = useCalculator();
  const outcome = live.outcomes[scenarioIndex];
  if (!outcome) {
    return null;
  }
  const window = outcome.summary.forecastMonths;
  const { plan } = outcome.result;
  const months = plan.newHires.slice(0, window);
  const newHires = months.reduce((total, value) => total + value, 0);
  const backfills =
    plan.hires.slice(0, window).reduce((total, value) => total + value, 0) - newHires;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (newHires === 0) {
    return <p className="gcc-empty">{STATS.none}</p>;
  }
  const peak = months.reduce((best, value, index) => (value > months[best] ? index : best), 0);
  const first = months.findIndex((value) => value > 0) + 1;
  const last = months.findLastIndex((value) => value > 0) + 1;
  const rows = [
    [STATS.newHires, number.format(newHires)],
    [STATS.backfills, number.format(backfills)],
    [STATS.peak, STATS.month(peak + 1, number.format(months[peak]))],
    [STATS.timeline, STATS.range(first, last)],
  ] as const;
  return (
    <section className="gcc-stats" aria-label={STATS.title}>
      <p className="gcc-stats__lead">{STATS.title}</p>
      <dl className="gcc-stats__grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
