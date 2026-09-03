import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import type { AnyReport } from './reports.types';
import { ReportPanel } from './ReportPanel';
import {
  employeesReport,
  headcountReport,
  attendanceReport,
  leaveReport,
  holidaysReport,
  requestsReport,
} from './reports.people';
import { goalsReport, performanceReport, trainingReport, exitsReport } from './reports.growth';

const REPORTS: AnyReport[] = [
  employeesReport,
  headcountReport,
  attendanceReport,
  leaveReport,
  holidaysReport,
  requestsReport,
  goalsReport,
  performanceReport,
  trainingReport,
  exitsReport,
];

/** Route the report tabs live under; the chosen report is a slug beneath it. */
const REPORTS_PATH = '/hr/reports';

/** One tab per report; the report's own key is its slug. */
const TABS: TabberItem[] = REPORTS.map((report) => ({
  slug: report.key,
  label: report.label,
  content: <ReportPanel report={report} />,
}));

/**
 * HR reports: pick one, see it, export every row as CSV (opens in Excel). The
 * chosen report is a slug in the URL, so a report can be linked to and survives
 * a reload.
 */
export function ReportsPage() {
  return (
    <Box>
      <PageHeader title="Reports" subtitle="Every HR dataset, on screen and as CSV" />

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <Tabber
          basePath={REPORTS_PATH}
          items={TABS}
          variant="scrollable"
          ariaLabel="HR reports"
          sx={{ mb: 1.5 }}
        />
      </Box>
    </Box>
  );
}
