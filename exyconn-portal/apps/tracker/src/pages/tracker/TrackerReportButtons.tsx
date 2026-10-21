import DownloadRounded from '@mui/icons-material/DownloadRounded';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import { useT } from '@exyconn/i18n';
import { Button, Flex } from '@exyconn/shell/components/ui';
import type { ReportFormat } from './useHoursReportDownload';

interface TrackerReportButtonsProps {
  /** The download reports its own failures, so the buttons just start it. */
  report: { download: (format: ReportFormat) => Promise<void>; downloading: ReportFormat | null };
  disabled: boolean;
}

/** The month's hours report as a PDF to read or an XLSX sheet to work with. */
export function TrackerReportButtons({ report, disabled }: Readonly<TrackerReportButtonsProps>) {
  const t = useT();
  return (
    <Flex direction="row" gap={1} flexWrap="wrap">
      <Button
        variant="contained"
        startIcon={<PictureAsPdfOutlined />}
        loading={report.downloading === 'PDF'}
        disabled={disabled || report.downloading !== null}
        onClick={() => report.download('PDF')}
      >
        {t('Download PDF report')}
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadRounded />}
        loading={report.downloading === 'XLSX'}
        disabled={disabled || report.downloading !== null}
        onClick={() => report.download('XLSX')}
      >
        {t('Download XLSX')}
      </Button>
    </Flex>
  );
}
