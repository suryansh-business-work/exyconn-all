import { useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { SslCertificateRow } from './ssl.types';
import { DaysLeft, SslStatusChip } from './SslStatusChip';

interface SslCertificateDialogProps {
  certificate: SslCertificateRow | null;
  warningDays: number;
  onClose: () => void;
}

/** A date the certificate carries, in the admin-configured format; a dash when unknown. */
function useCertificateDate() {
  const { formatDateTime } = useSettings();
  return (value?: string | null) => (value ? formatDateTime(value) : '—');
}

/** Everything the handshake read off one host's certificate. */
export function SslCertificateDialog({
  certificate,
  warningDays,
  onClose,
}: Readonly<SslCertificateDialogProps>) {
  const t = useT();
  const date = useCertificateDate();
  if (!certificate) {
    return null;
  }
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="ssl-certificate-title">
      <DialogTitle id="ssl-certificate-title">{certificate.host}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DetailFactGrid>
            <DetailFact label="Status">
              <SslStatusChip status={certificate.status} />
            </DetailFact>
            <DetailFact label="Days left">
              <DaysLeft daysLeft={certificate.daysLeft} warningDays={warningDays} />
            </DetailFact>
            <DetailFact label="Valid from">{date(certificate.validFrom)}</DetailFact>
            <DetailFact label="Valid until">{date(certificate.validTo)}</DetailFact>
            <DetailFact label="Subject">{certificate.subject || '—'}</DetailFact>
            <DetailFact label="Issuer">{certificate.issuer || '—'}</DetailFact>
            <DetailFact label="Protocol">{certificate.protocol || '—'}</DetailFact>
            <DetailFact label="Chain trusted">
              {certificate.authorized ? t('Yes') : t('No')}
            </DetailFact>
            <DetailFact label="Checked">{date(certificate.checkedAt)}</DetailFact>
          </DetailFactGrid>
          <DetailFact label="Monitors">{certificate.monitors.join(', ')}</DetailFact>
          <DetailFact label="Names covered">{certificate.altNames.join(', ') || '—'}</DetailFact>
          <DetailFact label="Serial number">{certificate.serialNumber || '—'}</DetailFact>
          <DetailFact label="SHA-256 fingerprint">{certificate.fingerprint256 || '—'}</DetailFact>
          {certificate.error && <DetailFact label="Problem">{certificate.error}</DetailFact>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
