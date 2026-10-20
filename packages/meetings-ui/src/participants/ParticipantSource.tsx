import { useT } from '@exyconn/i18n';
import { Chip, Flex, Tooltip } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { MaParticipantSource } from '@exyconn/shell/graphql/generated';
import { confidencePercent } from '../lib/format';

interface ParticipantSourceProps {
  source: MaParticipantSource;
  confidence: number;
}

/**
 * Where a participant record came from. Names read off Meet's visible call UI are a best
 * effort — Meet does not hand them over — so those carry their confidence and say so.
 */
export function ParticipantSource({ source, confidence }: Readonly<ParticipantSourceProps>) {
  const t = useT();
  if (source !== MaParticipantSource.MeetUi) {
    return <StatusChip value={source} />;
  }
  return (
    <Flex direction="row" spacing={0.5}>
      <StatusChip value={source} />
      <Tooltip title={t('Read from the visible Meet window, so the name may be incomplete.')}>
        <Chip
          tabIndex={0}
          size="small"
          variant="outlined"
          color="warning"
          label={t('Best effort · {percent}%', { percent: confidencePercent(confidence) })}
        />
      </Tooltip>
    </Flex>
  );
}
