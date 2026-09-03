import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { Box, Button, Flex, Tab, Tabs, Text } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { toCsv, downloadCsv } from '@exyconn/shell/utils/csv';
import DownloadIcon from '@mui/icons-material/Download';
import type { AnyReport } from './reports.types';
import { ReportTable } from './ReportTable';
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

const PREVIEW_ROWS = 50;

/** HR reports: pick one, see it, export every row as CSV (opens in Excel). */
export function ReportsPage() {
  const client = useApolloClient();
  const notify = useNotify();
  const [activeKey, setActiveKey] = useState(REPORTS[0].key);
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const report = useMemo(() => REPORTS.find((r) => r.key === activeKey) ?? REPORTS[0], [activeKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await report.load(client));
    } catch (error) {
      setRows([]);
      notify(error instanceof Error ? error.message : 'Could not load the report', 'error');
    } finally {
      setLoading(false);
    }
  }, [client, notify, report]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${report.key}-${stamp}`, toCsv(rows, report.columns));
    notify(`Exported ${rows.length} rows.`, 'success');
  };

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Every HR dataset, on screen and as CSV" />

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <Tabs
          value={activeKey}
          onChange={(_event, value: string) => setActiveKey(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 1.5 }}
        >
          {REPORTS.map((r) => (
            <Tab key={r.key} value={r.key} label={r.label} />
          ))}
        </Tabs>

        <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Text size="sm" color="text.secondary">
            {report.description}
            {!loading && ` · ${rows.length} rows`}
          </Text>
          <Button
            startIcon={<DownloadIcon />}
            onClick={exportCsv}
            disabled={loading || rows.length === 0}
          >
            Export CSV
          </Button>
        </Flex>

        <ReportTable
          columns={report.columns}
          rows={rows}
          loading={loading}
          previewLimit={PREVIEW_ROWS}
        />
      </Box>
    </Box>
  );
}
