import { useT } from '@exyconn/i18n';
import { Box, Chip, Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { SonarAnalysisRow } from './sonar.types';

/** One analysis: when it ran, the version it analysed and what it flagged (gate changes, versions). */
function AnalysisItem({ analysis }: Readonly<{ analysis: SonarAnalysisRow }>) {
  const { formatDateTime } = useSettings();
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', py: 1 }}>
      <Text size="sm" weight="medium">
        {formatDateTime(analysis.date)}
      </Text>
      {analysis.version && (
        <Text size="sm" color="text.secondary">
          {analysis.version}
        </Text>
      )}
      {analysis.events.map((event) => (
        <Chip key={event} size="small" variant="outlined" label={event} />
      ))}
    </Stack>
  );
}

/** The project's latest analyses, newest first. */
export function RecentAnalyses({ analyses }: Readonly<{ analyses: readonly SonarAnalysisRow[] }>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Text size="label" component="h2" sx={{ mb: 0.5 }}>
        {t('Recent analyses')}
      </Text>
      {analyses.length === 0 && (
        <Text size="sm" color="text.secondary">
          {t('No analysis has run yet.')}
        </Text>
      )}
      <Stack divider={<Divider flexItem />}>
        {analyses.map((analysis) => (
          <AnalysisItem key={analysis.key} analysis={analysis} />
        ))}
      </Stack>
    </Box>
  );
}
