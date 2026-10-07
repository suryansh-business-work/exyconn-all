import type { AnyReport } from '../../../../src/pages/reports/reports.types';

/** Each report's own panel loads from the server and has its own tests; this shows which one. */
export function PanelStub({ report }: Readonly<{ report: AnyReport }>) {
  return <p>{`Panel for ${report.key}`}</p>;
}
