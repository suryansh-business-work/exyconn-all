import { useT } from '@exyconn/i18n';
import GavelIcon from '@mui/icons-material/Gavel';
import { Box, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useMaDecisionsQuery } from '@exyconn/shell/graphql/generated';
import { EvidenceQuotes } from '../../lib/EvidenceQuotes';
import { LoadError } from '../../lib/LoadError';
import { confidencePercent } from '../../lib/format';

/** What was decided in the call, each with the quotes that show it was. */
export function DecisionsTab({ meetingId }: Readonly<{ meetingId: string }>) {
  const t = useT();
  const { data, error, refetch } = useMaDecisionsQuery({ variables: { meetingId } });
  if (error) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  if (!data) {
    return <PanelSkeleton />;
  }
  if (data.maDecisions.length === 0) {
    return (
      <EmptyState
        icon={<GavelIcon />}
        title="No decisions were recorded"
        description="Decisions appear here once the AI notes are written."
      />
    );
  }
  return (
    <Flex direction="column" spacing={2}>
      {data.maDecisions.map((decision) => (
        <Box key={decision.id} sx={panel}>
          <Flex direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
            <Text weight="semibold">{decision.text}</Text>
            <Chip
              size="small"
              variant="outlined"
              label={t('{percent}% confident', { percent: confidencePercent(decision.confidence) })}
            />
          </Flex>
          <EvidenceQuotes evidence={decision.evidence} />
        </Box>
      ))}
    </Flex>
  );
}
