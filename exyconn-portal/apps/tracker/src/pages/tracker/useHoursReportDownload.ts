import { useCallback } from 'react';
import { useTrackerExpectedReportLazyQuery } from '@exyconn/shell/graphql/generated';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { downloadBase64File } from '@exyconn/shell/utils/file';

interface ReportArgs {
  employeeId: string | null;
  range: { from: string; to: string };
  timezone: string;
}

/** Downloads the selected employee's month as the portal's XLSX hours report. */
export function useHoursReportDownload({ employeeId, range, timezone }: ReportArgs) {
  const notify = useNotify();
  const [fetchReport, { loading }] = useTrackerExpectedReportLazyQuery({
    fetchPolicy: 'network-only',
  });

  const download = useCallback(async () => {
    if (!employeeId) {
      return;
    }
    try {
      const { data, error } = await fetchReport({
        variables: { userId: employeeId, ...range, timezone },
      });
      if (error ?? !data) {
        throw error ?? new Error('The report could not be generated.');
      }
      const file = data.trackerExpectedReport;
      downloadBase64File(file.fileName, file.mimeType, file.contentBase64);
    } catch (error) {
      console.error('Downloading the hours report failed', error);
      notify(error instanceof Error ? error.message : 'Could not download the report', 'error');
    }
  }, [employeeId, range, timezone, fetchReport, notify]);

  return { download, downloading: loading };
}
