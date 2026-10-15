import { useCalculator, useMoney } from "../../state/CalculatorContext";
import { P } from "../../strings/people";

/**
 * Payroll in the scenario's operating-phase month (set in Forecast & assumptions) and the
 * recruitment fees inside the forecast — read from the engine's charges, not recomputed here.
 */
export function PayrollStats() {
  const { live, scenarioIndex, locale } = useCalculator();
  const money = useMoney();
  const outcome = live.outcomes[scenarioIndex];
  if (!outcome) {
    return null;
  }
  const { result, summary } = outcome;
  const month = summary.phaseMonth;
  const payroll = result.charges
    .filter((item) => item.section === "payroll" && item.month === month)
    .reduce((total, item) => total + item.amount, 0);
  const recruitment = summary.byGroup
    .filter((group) => group.section === "recruitment")
    .reduce((total, group) => total + group.total, 0);
  const headcount = result.months[month - 1]?.headcount ?? 0;
  const perHead = headcount > 0 ? Math.round(payroll / headcount) : 0;
  const stats = [
    [P.stats.monthly, money.format(payroll)],
    [P.stats.annual, money.format(payroll * 12)],
    [P.stats.loaded, money.format(perHead)],
    [P.stats.recruitment, money.format(recruitment)],
  ] as const;
  return (
    <section className="gcc-stats" aria-label={P.stats.title}>
      <p className="gcc-stats__lead">
        {P.stats.headcount(
          new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(headcount),
          month
        )}
      </p>
      <dl className="gcc-stats__grid">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
