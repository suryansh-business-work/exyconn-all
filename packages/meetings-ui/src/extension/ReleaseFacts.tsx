import { useFormatters, useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MaReleaseFieldsFragment } from '@exyconn/shell/graphql/generated';

/** A release's version, date, compatibility, channel and checksum. */
export function ReleaseFacts({ release }: Readonly<{ release: MaReleaseFieldsFragment }>) {
  const t = useT();
  const { formatDate } = useFormatters();
  return (
    <DetailFactGrid>
      <DetailFact label="Current version">{release.version}</DetailFact>
      <DetailFact label="Released">{formatDate(release.builtAt)}</DetailFact>
      <DetailFact label="Compatibility">
        {t('Chrome {version} or later', { version: release.minChromeVersion })}
      </DetailFact>
      <DetailFact label="Release channel">
        <StatusChip value={release.channel} />
      </DetailFact>
      <DetailFact label="SHA-256 checksum">
        <Box component="code" sx={{ wordBreak: 'break-all', userSelect: 'all' }}>
          {release.sha256}
        </Box>
      </DetailFact>
    </DetailFactGrid>
  );
}
