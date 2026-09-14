import { useCallback, useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { Button, Flex, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { toCsv, downloadCsv } from '@exyconn/shell/utils/csv';
import DownloadIcon from '@mui/icons-material/Download';
import type { AnyReport } from './reports.types';
import { ReportTable } from './ReportTable';

const PREVIEW_ROWS = 50;

/** One report: loads on mount, shows a preview and exports every row as CSV. */
export function ReportPanel({ report }: Readonly<{ report: AnyReport }>) {
  const t = useT();
  const client = useApolloClient();
  const notify = useNotify();
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

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
    notify(t('Exported {count} rows.', { count: rows.length }), 'success');
  };

  const rowCount = loading ? '' : ` · ${t('{count} rows', { count: rows.length })}`;

  return (
    <>
      <Flex direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Text size="sm" color="text.secondary">
          {t(report.description)}
          {rowCount}
        </Text>
        <Button
          startIcon={<DownloadIcon />}
          onClick={exportCsv}
          disabled={loading || rows.length === 0}
        >
          {t('Export CSV')}
        </Button>
      </Flex>

      <ReportTable
        columns={report.columns}
        rows={rows}
        loading={loading}
        onRefresh={load}
        previewLimit={PREVIEW_ROWS}
      />
    </>
  );
}
