import type { ReportModel, ReportRow } from "@exyconn/gcc-cost";

function Rows({ title, rows }: Readonly<{ title: string; rows: readonly ReportRow[] }>) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <table>
      <caption>{title}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={`${title}:${row.label}`}>
            <th scope="row">{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The report as headings and tables: printed, and shown to the reader of a shared link. */
export function ReportBody({ report }: Readonly<{ report: ReportModel }>) {
  return (
    <>
      <h2 className="gcc-report__title">{report.title}</h2>
      <p>
        {report.generatedOn} · {report.reportingCurrency}
      </p>
      <Rows title="Company and exchange rates" rows={report.company} />
      {report.scenarios.map((scenario) => (
        <section key={scenario.name}>
          <h3>{scenario.name}</h3>
          <Rows title="Cost summary" rows={scenario.headline} />
          <Rows title="Forecast totals" rows={scenario.horizons} />
          <Rows title="Operating cost by year" rows={scenario.annual} />
          <Rows title="Cost by category" rows={scenario.groups} />
          <Rows title="Line items" rows={scenario.items} />
          <Rows title="Cost by department" rows={scenario.departments} />
          <Rows title="Assumptions" rows={scenario.assumptions} />
          {scenario.reviewItems.length > 0 && (
            <p>Requires professional review: {scenario.reviewItems.join(", ")}</p>
          )}
          {scenario.issues.map((issue) => (
            <p key={issue}>{issue}</p>
          ))}
        </section>
      ))}
      <h3>Methodology</h3>
      <ul>
        {report.methodology.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p>{report.disclaimer}</p>
    </>
  );
}
