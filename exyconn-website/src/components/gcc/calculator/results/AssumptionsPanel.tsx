import { DISCLAIMER, METHODOLOGY, type ScenarioSummary } from "@exyconn/gcc-cost";
import { RESULTS } from "../strings/results";

function Items({ title, items }: Readonly<{ title: string; items: readonly string[] }>) {
  return (
    <div>
      <h4 className="gcc-panel__subtitle">{title}</h4>
      {items.length === 0 ? (
        <p className="gcc-empty">{RESULTS.none}</p>
      ) : (
        <ul className="gcc-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Methodology, exclusions, uncertain and illustrative items, and the disclaimer. */
export function AssumptionsPanel({ summary }: Readonly<{ summary: ScenarioSummary }>) {
  return (
    <section className="gcc-panel">
      <h3 className="gcc-panel__title">{RESULTS.assumptions}</h3>
      <div className="gcc-panels">
        <Items title={RESULTS.assumptions} items={[...METHODOLOGY, ...RESULTS.exclusions]} />
        <div>
          <Items title={RESULTS.review} items={summary.reviewItems} />
          <Items title={RESULTS.illustrative} items={summary.illustrativeItems} />
        </div>
      </div>
      <p className="gcc-disclaimer">{DISCLAIMER}</p>
    </section>
  );
}
