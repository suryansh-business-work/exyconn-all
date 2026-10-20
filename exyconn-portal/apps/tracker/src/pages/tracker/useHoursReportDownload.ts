import { useCallback, useState } from 'react';
import {
  useTrackerExpectedReportLazyQuery,
  useTrackerHoursReportPdfLazyQuery,
} from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadBase64File } from '@exyconn/shell/utils/file';

export type ReportFormat = 'XLSX' | 'PDF';

interface ReportArgs {
  employeeId: string | null;
  range: { from: string; to: string };
  timezone: string;
}

/** Downloads the selected employee's month as the XLSX sheet or the PDF report. */
export function useHoursReportDownload({ employeeId, range, timezone }: ReportArgs) {
  const notify = useNotify();
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const [fetchSheet] = useTrackerExpectedReportLazyQuery({ fetchPolicy: 'network-only' });
  const [fetchPdf] = useTrackerHoursReportPdfLazyQuery({ fetchPolicy: 'network-only' });

  const download = useCallback(
    async (format: ReportFormat) => {
      if (!employeeId) {
        return;
      }
      setBusy(format);
      const variables = { userId: employeeId, ...range, timezone };
      try {
        const file =
          format === 'PDF'
            ? (await fetchPdf({ variables })).data?.trackerHoursReportPdf
            : (await fetchSheet({ variables })).data?.trackerExpectedReport;
        if (!file) {
          throw new Error('The report could not be generated.');
        }
        downloadBase64File(file.fileName, file.mimeType, file.contentBase64);
      } catch (error) {
        portalLogger.error('Tracker: downloading the hours report failed', error);
        notify(error instanceof Error ? error.message : 'Could not download the report', 'error');
      } finally {
        setBusy(null);
      }
    },
    [employeeId, range, timezone, fetchSheet, fetchPdf, notify],
  );

  return { download, downloading: busy };
}
