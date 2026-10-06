import {
  type Estimate,
  formatAdjustment,
  formatDuration,
  formatUsd,
} from "../../../lib/company/quote";
import type { QuoteText } from "./quote.types";

/** The estimate's breakdown as terms and values — the panel and the review step share it. */
export function SummaryList({
  quote,
  text,
}: Readonly<{ quote: Estimate; text: QuoteText["summary"] }>) {
  const rows = [
    { term: text.projectType, value: quote.projectType.label },
    { term: text.team, value: `${quote.teamSize} ${text.members}` },
    { term: text.duration, value: formatDuration(quote.months) },
    { term: text.hours, value: `${quote.hoursPerMonth}${text.hoursSuffix}` },
    { term: text.base, value: formatUsd(quote.baseTotal) },
    {
      term: `${text.complexity} (${quote.projectType.multiplier}x)`,
      value: formatAdjustment(quote.projectType.multiplier),
    },
  ];
  return (
    <dl className="quote-breakdown">
      {rows.map((row) => (
        <div key={row.term}>
          <dt>{row.term}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
