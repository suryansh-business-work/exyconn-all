import { useT } from '@exyconn/i18n';
import { Box, Card, Divider, Typography, fontWeight } from '@exyconn/shell/components/ui';
import { formatWith } from '@exyconn/shell/utils/date';
import type { ProblemReportRow } from './problem-report.types';

interface ReportedDetailsProps {
  report: ProblemReportRow;
}

/** Read-only recap of what the reporter sent, shown above the triage fields. */
export function ReportedDetails({ report }: Readonly<ReportedDetailsProps>) {
  const t = useT();
  const service = report.serviceName || t('Whole platform');
  const received = formatWith(report.createdAt, 'd MMM yyyy, HH:mm');

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: fontWeight.bold,
        }}
      >
        {report.reference} · {report.subject}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {service} · {report.category} · {report.reporterName} ({report.reporterEmail}) · {received}
      </Typography>
      <Divider sx={{ my: 1.5 }} />
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {report.description}
      </Typography>
      {report.pageUrl && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t('Reported from {url}', { url: report.pageUrl })}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
