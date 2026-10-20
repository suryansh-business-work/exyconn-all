import { useState } from 'react';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadBase64File } from '@exyconn/shell/utils/file';
import { useMyTrackerHoursReportPdfLazyQuery } from '@exyconn/shell/graphql/generated';

interface MyHoursReportButtonProps {
  range: { from: string; to: string };
  timezone: string;
}

/** Downloads the employee's own month as the PDF hours report. */
export function MyHoursReportButton({ range, timezone }: Readonly<MyHoursReportButtonProps>) {
  const t = useT();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const [fetchPdf] = useMyTrackerHoursReportPdfLazyQuery({ fetchPolicy: 'network-only' });

  const download = async () => {
    setBusy(true);
    try {
      const file = (await fetchPdf({ variables: { ...range, timezone } })).data
        ?.myTrackerHoursReportPdf;
      if (!file) {
        throw new Error('The report could not be generated.');
      }
      downloadBase64File(file.fileName, file.mimeType, file.contentBase64);
    } catch (error) {
      portalLogger.error('My Tracker: downloading the hours report failed', error);
      notify(error instanceof Error ? error.message : 'Could not download the report', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="contained"
      startIcon={<PictureAsPdfOutlined />}
      loading={busy}
      onClick={download}
    >
      {t('Download PDF report')}
    </Button>
  );
}
