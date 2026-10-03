import { useState } from 'react';
import { Alert, Box, Button, Typography } from '@exyconn/shell/components/ui';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useT } from '@exyconn/i18n';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useMigrateDnsToCloudflareMutation,
  type MigrateDnsToCloudflareMutation,
} from '@exyconn/shell/graphql/generated';
import type { DnsOverview } from './dns.types';

type Failure = MigrateDnsToCloudflareMutation['migrateDnsToCloudflare']['failed'][number];

interface ShiftPanelProps {
  overview: DnsOverview;
  onChanged: () => Promise<unknown>;
}

/**
 * Copies GoDaddy's records into Cloudflare. Nothing changes for visitors yet: the domain keeps
 * answering from GoDaddy until its nameservers are switched, so this is safe to run at any
 * time and again — it only fills what is still missing.
 */
export function ShiftPanel({ overview, onChanged }: Readonly<ShiftPanelProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [migrate, { loading }] = useMigrateDnsToCloudflareMutation();
  const [failures, setFailures] = useState<Failure[]>([]);
  const missing = overview.missingOnCloudflare;

  const shift = async () => {
    const ok = await confirm({
      title: 'Shift DNS to Cloudflare?',
      message: overview.zone
        ? 'Copy {count} record(s) from GoDaddy into the Cloudflare zone for {domain}. Records already on Cloudflare are left alone, and visitors are not affected until the nameservers are switched.'
        : 'Create a Cloudflare zone for {domain} and copy {count} record(s) into it from GoDaddy. Visitors are not affected until the nameservers are switched.',
      messageValues: { count: missing, domain: overview.domain },
    });
    if (!ok) {
      return;
    }
    try {
      const { data } = await migrate({ variables: { domain: overview.domain } });
      const result = data?.migrateDnsToCloudflare;
      setFailures(result?.failed ?? []);
      notify(
        'Copied {created} record(s) to Cloudflare; {failed} failed',
        result?.failed.length ? 'warning' : 'success',
        { created: result?.created ?? 0, failed: result?.failed.length ?? 0 },
      );
      await onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Shifting the DNS failed', 'error');
    }
  };

  return (
    <Box component="section" aria-labelledby="dns-shift-title">
      <Typography id="dns-shift-title" variant="subtitle1">
        {t('Records')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {missing > 0
          ? t('{count} GoDaddy record(s) are not on Cloudflare yet.', { count: missing })
          : t('Every GoDaddy record is on Cloudflare.')}
      </Typography>
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={shift}
        disabled={loading || (missing === 0 && Boolean(overview.zone))}
      >
        {loading ? t('Shifting…') : t('Shift DNS to Cloudflare')}
      </Button>
      {failures.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {failures.map((failure) => (
            <Box key={`${failure.type}-${failure.name}-${failure.content}`}>
              {failure.type} {failure.name}: {failure.message}
            </Box>
          ))}
        </Alert>
      )}
    </Box>
  );
}
