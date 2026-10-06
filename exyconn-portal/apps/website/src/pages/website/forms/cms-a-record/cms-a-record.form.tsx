import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DnsIcon from '@mui/icons-material/Dns';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Dialog, DialogContent, DialogTitle } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSetCmsSiteARecordMutation } from '@exyconn/shell/graphql/generated';
import {
  MIN_TTL,
  aRecordSchema,
  type ARecordFormInput,
  type ARecordFormValues,
  type CmsDomainDnsRow,
} from './cms-a-record.types';

interface ARecordFormProps {
  siteId: string;
  /** The domain whose A record is set; null keeps the dialog closed. */
  domain: CmsDomainDnsRow | null;
  /** The websites' server address, offered as the value to point at; '' when unknown. */
  serverIp: string;
  onClose: () => void;
  onDone: () => void;
}

/**
 * Sets a domain's A record at whichever provider serves its DNS (GoDaddy or Cloudflare),
 * replacing the A records the host has. Asks first: a DNS change takes minutes to spread
 * and points visitors elsewhere meanwhile.
 */
export function ARecordForm({
  siteId,
  domain,
  serverIp,
  onClose,
  onDone,
}: Readonly<ARecordFormProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [setRecord] = useSetCmsSiteARecordMutation();
  const methods = useForm<ARecordFormInput, unknown, ARecordFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(aRecordSchema),
    defaultValues: { ip: serverIp, ttl: MIN_TTL },
  });
  const { reset, setValue } = methods;
  useEffect(() => {
    reset({ ip: domain?.records[0]?.ip ?? serverIp, ttl: domain?.records[0]?.ttl ?? MIN_TTL });
  }, [domain, serverIp, reset]);

  const onSubmit = async (values: ARecordFormValues) => {
    if (!domain) return;
    const ok = await confirm({
      title: 'Point {domain} at {ip}?',
      titleValues: { domain: domain.domain, ip: values.ip },
      message:
        'Every A record of this host is replaced. DNS changes take minutes (up to the old TTL) to reach every visitor.',
      confirmText: 'Update DNS',
    });
    if (!ok) return;
    try {
      await setRecord({
        variables: { siteId, domain: domain.domain, ip: values.ip, ttl: values.ttl },
      });
      notify('{domain} now points at {ip}', 'success', { domain: domain.domain, ip: values.ip });
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not update the DNS record'), 'error');
    }
  };

  return (
    <Dialog
      open={domain !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="a-record-title"
    >
      <DialogTitle id="a-record-title">
        {t('A record for {domain}', { domain: domain?.domain ?? '' })}
      </DialogTitle>
      <DialogContent>
        <EntityForm
          methods={methods}
          onSubmit={onSubmit}
          isEdit
          onCancel={onClose}
          submitLabel="Save record"
        >
          {serverIp ? (
            <Button
              variant="outlined"
              startIcon={<DnsIcon />}
              onClick={() => setValue('ip', serverIp, { shouldValidate: true, shouldDirty: true })}
            >
              {t('Use Exyconn server ({ip})', { ip: serverIp })}
            </Button>
          ) : (
            <Alert severity="info">
              {t('The websites server address is not configured, so enter the IP to point at.')}
            </Alert>
          )}
          <RhfTextField
            name="ip"
            label="IPv4 address"
            helperText="Where the domain should point."
          />
          <RhfTextField
            name="ttl"
            label="TTL (seconds)"
            type="number"
            helperText="How long resolvers may cache the record: 600 (10 minutes) to 86400 (a day)."
          />
        </EntityForm>
      </DialogContent>
    </Dialog>
  );
}
