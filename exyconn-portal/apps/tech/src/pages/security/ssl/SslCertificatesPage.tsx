import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import HttpsIcon from '@mui/icons-material/Https';
import { Alert, Box, Button, LinearProgress, Text, color } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { StatRow } from '@exyconn/shell/components/dashboard/StatRow';
import { DataTable } from '@exyconn/shell/components/data/DataTable';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { SslCertificateStatus, useSslCertificatesQuery } from '@exyconn/shell/graphql/generated';
import { countStatus, type SslCertificateRow } from './ssl.types';
import { sslColumns } from './ssl-columns';
import { SslCertificateDialog } from './SslCertificateDialog';

/** Where the hosts on this screen are managed. */
const STATUS_MONITORS_PATH = '/tech/status-monitors';

/** The four summary tiles over the report's rows. */
function summary(rows: readonly SslCertificateRow[]) {
  return [
    { label: 'Hosts checked', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Valid',
      value: String(countStatus(rows, SslCertificateStatus.Ok)),
      accent: color.green[300],
    },
    {
      label: 'Expiring soon',
      value: String(countStatus(rows, SslCertificateStatus.Expiring)),
      accent: color.orange[500],
    },
    {
      label: 'Expired or invalid',
      value: String(countStatus(rows, SslCertificateStatus.Expired, SslCertificateStatus.Invalid)),
      accent: color.red[200],
    },
  ];
}

/**
 * Tech › Security › SSL certificates: the certificate every https host on Status monitors
 * presents, read live off a TLS handshake. The server caches a report for ten minutes;
 * Refresh checks every host again.
 */
export function SslCertificatesPage() {
  const t = useT();
  const navigate = useNavigate();
  const notify = useNotify();
  const { formatDate, formatDateTime } = useSettings();
  const { data, loading, error, refetch } = useSslCertificatesQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<SslCertificateRow | null>(null);

  const report = data?.sslCertificates;
  const warningDays = report?.warningDays ?? 0;
  const rows = useMemo(
    () => (report?.certificates ?? []).map((row) => ({ ...row, id: row.host })),
    [report],
  );
  const columns = useMemo(() => sslColumns(warningDays, formatDate), [warningDays, formatDate]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch({ refresh: true });
    } catch (err) {
      notify(errorMessage(err, t('The certificates could not be checked.')), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const empty = report !== undefined && rows.length === 0;

  return (
    <Box>
      <PageHeader
        title="SSL certificates"
        subtitle="The certificate every https host on Status monitors presents, and when it runs out"
      >
        <Button variant="outlined" onClick={refresh} disabled={refreshing || !data}>
          {refreshing ? t('Checking…') : t('Refresh')}
        </Button>
      </PageHeader>

      {(refreshing || (!data && loading)) && (
        <LinearProgress sx={{ mb: 1.5 }} aria-label={t('Checking certificates')} />
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(error, t('The certificates could not be checked.'))}
        </Alert>
      )}

      {empty && (
        <Box sx={panel}>
          <EmptyState
            icon={<HttpsIcon />}
            title="No https hosts to check"
            description="Certificates are read from the https addresses on Status monitors. Add a monitor to see its certificate here."
            actionLabel="Open Status monitors"
            onAction={() => navigate(STATUS_MONITORS_PATH)}
          />
        </Box>
      )}

      {report && !empty && (
        <>
          <StatRow stats={summary(rows)} />
          <Text size="sm" color="text.secondary" component="p" sx={{ my: 1.5 }}>
            {t('Checked {time}. Expiring soon means {days} days or fewer left.', {
              time: formatDateTime(report.checkedAt),
              days: warningDays,
            })}
          </Text>
          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={setSelected}
            emptyMessage="No certificates."
          />
        </>
      )}

      <SslCertificateDialog
        certificate={selected}
        warningDays={warningDays}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
