import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { ItEmployeeProfileQuery } from '@exyconn/shell/graphql/generated';

type Profile = ItEmployeeProfileQuery['itEmployeeProfile'];

/** A titled panel that says so when it has nothing to list, rather than showing nothing. */
function Section({
  title,
  empty,
  children,
}: Readonly<{ title: string; empty: boolean; children: ReactNode }>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Text size="label" sx={{ display: 'block', mb: 1 }}>
        {t(title)}
      </Text>
      {empty ? (
        <Text size="sm" color="text.secondary">
          {t('None')}
        </Text>
      ) : (
        <Stack spacing={1}>{children}</Stack>
      )}
    </Box>
  );
}

/** One line in a section: what it is, a chip for its state, and a detail on the right. */
function Row({
  label,
  chip,
  detail,
}: Readonly<{ label: ReactNode; chip?: string; detail?: string }>) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Text size="sm" sx={{ flex: 1, minWidth: 0 }}>
        {label}
      </Text>
      {chip && <StatusChip value={chip} />}
      {detail && (
        <Text size="caption" color="text.secondary">
          {detail}
        </Text>
      )}
    </Stack>
  );
}

export function DevicesSection({ profile }: Readonly<{ profile: Profile }>) {
  return (
    <Section title="Assigned devices" empty={profile.assets.length === 0}>
      {profile.assets.map((asset) => (
        <Row
          key={asset.id}
          label={
            <Link component={RouterLink} to={`/it/assets/${asset.id}`} underline="hover">
              {asset.assetTag} · {asset.name}
            </Link>
          }
          chip={asset.edrStatus}
          detail={asset.serialNumber}
        />
      ))}
    </Section>
  );
}

export function AccessSection({ profile }: Readonly<{ profile: Profile }>) {
  const { formatDate } = useSettings();
  return (
    <Section title="Application access, VPN & email" empty={profile.access.length === 0}>
      {profile.access.map((grant) => (
        <Row
          key={grant.application}
          label={
            grant.accessLevel ? `${grant.application} · ${grant.accessLevel}` : grant.application
          }
          detail={grant.expiresAt ? formatDate(grant.expiresAt) : formatDate(grant.grantedAt)}
        />
      ))}
    </Section>
  );
}

export function LicencesSection({ profile }: Readonly<{ profile: Profile }>) {
  const { formatDate } = useSettings();
  return (
    <Section title="Software licences" empty={profile.licences.length === 0}>
      {profile.licences.map((licence) => (
        <Row
          key={licence.id}
          label={`${licence.name} · ${licence.vendor}`}
          chip={licence.status}
          detail={formatDate(licence.renewalDate)}
        />
      ))}
    </Section>
  );
}

export function RequestsSection({ profile }: Readonly<{ profile: Profile }>) {
  return (
    <Section title="Requests in progress" empty={profile.openRequests.length === 0}>
      {profile.openRequests.map((request) => (
        <Row
          key={request.id}
          label={`${request.application} · ${request.kind.replaceAll('_', ' ').toLowerCase()}`}
          chip={request.status}
        />
      ))}
    </Section>
  );
}
