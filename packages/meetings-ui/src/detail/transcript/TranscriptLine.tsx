import { useT } from '@exyconn/i18n';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import type { MaTranscriptQuery } from '@exyconn/shell/graphql/generated';
import { formatOffset } from '../../lib/format';

export type TranscriptSegment = MaTranscriptQuery['maTranscript'][number];

interface TranscriptLineProps {
  segment: TranscriptSegment;
  /** Opens "Confirm speaker" for this line's diarization label. */
  onConfirmSpeaker: (label: string) => void;
}

/**
 * One transcript line: when it was said, who said it and what. A speaker nobody has confirmed
 * shows the diarization label exactly as the model gave it ("Unknown Speaker 1") — a guessed
 * name would read as fact.
 */
export function TranscriptLine({ segment, onConfirmSpeaker }: Readonly<TranscriptLineProps>) {
  const t = useT();
  const label = segment.speakerLabel;
  const speaker = segment.speakerConfirmed && segment.speakerName ? segment.speakerName : label;
  return (
    <Box component="li" sx={{ py: 1, listStyle: 'none' }}>
      <Flex direction="row" spacing={1} alignItems="center">
        <Text size="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatOffset(segment.startMs)}
        </Text>
        <Text size="sm" weight="semibold">
          {speaker ?? t('Unknown speaker')}
        </Text>
        {segment.speakerConfirmed && label && (
          <Text size="caption" color="text.secondary">
            ({label})
          </Text>
        )}
        {!segment.speakerConfirmed && label && (
          <Tooltip title={t('Confirm who {label} is', { label })}>
            <IconButton
              size="small"
              aria-label={t('Confirm who {label} is', { label })}
              onClick={() => onConfirmSpeaker(label)}
            >
              <RecordVoiceOverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Flex>
      <Text component="p" sx={{ m: 0 }}>
        {segment.text}
      </Text>
    </Box>
  );
}
