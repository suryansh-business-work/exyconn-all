import type { ReportModel } from "@exyconn/gcc-cost";
import { ReportBody } from "./ReportBody";

/**
 * The print-friendly report: hidden on screen, the only thing printed (calculator.css). The same
 * report model as the PDF, so print and PDF never disagree.
 */
export function PrintReport({ report }: Readonly<{ report: ReportModel }>) {
  return (
    <article className="gcc-print" aria-hidden="true">
      <ReportBody report={report} />
    </article>
  );
}
