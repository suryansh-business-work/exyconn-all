import { useState } from 'react';
import { Box, Button, Chip, Grid, Stack, Typography } from '@exyconn/shell/components/ui';
import EditIcon from '@mui/icons-material/Edit';
import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  DnsAuthority,
  NameserverTarget,
  useSetDomainNameserversMutation,
} from '@exyconn/shell/graphql/generated';
import { NameserversForm } from './forms/nameservers';
import type { DnsOverview } from './dns.types';

const AUTHORITY_LABEL: Record<DnsAuthority, string> = {
  [DnsAuthority.Godaddy]: 'GoDaddy answers',
  [DnsAuthority.Cloudflare]: 'Cloudflare answers',
  [DnsAuthority.Other]: 'Custom nameservers',
};

/** The authority each switch target leads to. */
const AUTHORITY_OF = {
  [NameserverTarget.Godaddy]: DnsAuthority.Godaddy,
  [NameserverTarget.Cloudflare]: DnsAuthority.Cloudflare,
} as const;

const SWITCH_TARGETS = [NameserverTarget.Godaddy, NameserverTarget.Cloudflare] as const;
type SwitchTarget = (typeof SWITCH_TARGETS)[number];

/** Why a switch is not offered right now, or null when it is. */
function blockedReason(overview: DnsOverview, target: SwitchTarget): string | null {
  if (target === NameserverTarget.Cloudflare) {
    if (!overview.zone) return 'Shift the DNS to Cloudflare first — there is no zone yet.';
    if (overview.missingOnCloudflare > 0) return 'Shift the missing records first.';
    return null;
  }
  return overview.previousGodaddyNameServers.length === 0
    ? 'No GoDaddy nameservers on record — set them as custom nameservers.'
    : null;
}

function HostList({ title, hosts }: Readonly<{ title: string; hosts: readonly string[] }>) {
  const t = useT();
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {t(title)}
      </Typography>
      {hosts.length === 0 ? (
        <Typography variant="body2">—</Typography>
      ) : (
        hosts.map((host) => (
          <Typography key={host} variant="body2" sx={{ fontFamily: 'monospace' }}>
            {host}
          </Typography>
        ))
      )}
    </Box>
  );
}

interface NameserverPanelProps {
  overview: DnsOverview;
  onChanged: () => Promise<unknown>;
}

/**
 * Who answers for the domain, and the switch between GoDaddy and Cloudflare. The switch moves
 * the domain's nameservers at the registry; the server refuses Cloudflare while any record is
 * still missing there, and the button says why before anyone tries.
 */
export function NameserverPanel({ overview, onChanged }: Readonly<NameserverPanelProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [setNameservers, { loading }] = useSetDomainNameserversMutation();
  const [customOpen, setCustomOpen] = useState(false);
  const { domain, authority } = overview;

  const apply = async (target: NameserverTarget, nameServers?: string[]) => {
    try {
      const { data } = await setNameservers({ variables: { domain, target, nameServers } });
      notify('{domain} now points at {hosts}', 'success', {
        domain,
        hosts: (data?.setDomainNameservers ?? []).join(', '),
      });
      await onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Changing the nameservers failed', 'error');
    }
  };

  const switchTo = async (target: SwitchTarget) => {
    const toCloudflare = target === NameserverTarget.Cloudflare;
    const ok = await confirm({
      title: toCloudflare ? 'Switch DNS to Cloudflare?' : 'Switch DNS back to GoDaddy?',
      message: toCloudflare
        ? 'Point {domain} at Cloudflare’s nameservers. From then on Cloudflare alone answers for the domain; resolvers follow within minutes to 48 hours.'
        : 'Point {domain} back at GoDaddy’s nameservers. Changes made on Cloudflare since the switch will stop applying.',
      messageValues: { domain },
      destructive: true,
    });
    if (ok) {
      await apply(target);
    }
  };

  const other =
    authority === DnsAuthority.Godaddy ? NameserverTarget.Cloudflare : NameserverTarget.Godaddy;
  const blocked = blockedReason(overview, other);

  return (
    <Box component="section" aria-labelledby="dns-ns-title">
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap' }}>
        <Typography id="dns-ns-title" variant="subtitle1">
          {t('Nameservers')}
        </Typography>
        <Chip size="small" label={t(AUTHORITY_LABEL[authority])} />
      </Stack>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <HostList title="At the registry now" hosts={overview.godaddyNameServers} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <HostList title="Assigned by Cloudflare" hosts={overview.zone?.nameServers ?? []} />
        </Grid>
      </Grid>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        role="group"
        aria-label={t('Who answers for the domain')}
      >
        {SWITCH_TARGETS.map((target) => {
          const current = AUTHORITY_OF[target] === authority;
          const label = target === NameserverTarget.Cloudflare ? 'Cloudflare' : 'GoDaddy';
          return (
            <Button
              key={target}
              variant={current ? 'contained' : 'outlined'}
              aria-pressed={current}
              aria-describedby={blocked && !current ? 'dns-ns-blocked' : undefined}
              disabled={loading || current || blockedReason(overview, target) !== null}
              onClick={() => switchTo(target)}
            >
              {t(label)}
            </Button>
          );
        })}
        <Button
          variant="text"
          startIcon={<EditIcon />}
          onClick={() => setCustomOpen(true)}
          disabled={loading}
        >
          {t('Custom nameservers')}
        </Button>
      </Stack>
      {blocked && (
        <Typography
          id="dns-ns-blocked"
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          {t(blocked)}
        </Typography>
      )}
      <CrudDialog
        open={customOpen}
        title={t('Custom nameservers')}
        onClose={() => setCustomOpen(false)}
      >
        <NameserversForm
          current={overview.godaddyNameServers}
          onCancel={() => setCustomOpen(false)}
          onSubmit={async (nameServers) => {
            setCustomOpen(false);
            await apply(NameserverTarget.Custom, nameServers);
          }}
        />
      </CrudDialog>
    </Box>
  );
}
