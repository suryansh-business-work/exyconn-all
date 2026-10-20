import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Flex, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { MaTranscriptSource, type MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';
import { ConfirmSpeakerForm } from '../../forms/confirm-speaker';
import { OfficialImportBar } from './OfficialImportBar';
import { SpeakerMappings } from './SpeakerMappings';
import { TranscriptPage } from './TranscriptPage';

const EMPTY_TEXT: Readonly<Record<MaTranscriptSource, string>> = {
  [MaTranscriptSource.Ai]: 'No transcript was captured by the extension for this call.',
  [MaTranscriptSource.GoogleMeet]:
    'No Google Meet transcript has been imported. Transcription must have been on in Meet.',
};

/**
 * The transcript, either as the extension's AI transcribed it or as Google Meet's own
 * transcript import has it, a slice at a time with "Load more".
 */
export function TranscriptTab({ meeting }: Readonly<{ meeting: MaMeetingDetailFragment }>) {
  const t = useT();
  const [source, setSource] = useState(MaTranscriptSource.Ai);
  // One entry per loaded slice: null is the start of the call, then the offset each slice follows.
  const [cursors, setCursors] = useState<(number | null)[]>([null]);
  const [confirming, setConfirming] = useState<string | null>(null);

  const changeSource = (next: MaTranscriptSource | null) => {
    if (next) {
      setSource(next);
      setCursors([null]);
    }
  };

  return (
    <Box sx={panel}>
      <Flex direction="column" spacing={1.5} sx={{ mb: 2 }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={source}
          onChange={(_event, next: MaTranscriptSource | null) => changeSource(next)}
          aria-label={t('Transcript source')}
        >
          <ToggleButton value={MaTranscriptSource.Ai}>{t('Extension (AI)')}</ToggleButton>
          <ToggleButton value={MaTranscriptSource.GoogleMeet}>{t('Google Meet')}</ToggleButton>
        </ToggleButtonGroup>
        <OfficialImportBar meetingId={meeting.id} status={meeting.officialImportStatus} />
        <SpeakerMappings mappings={meeting.speakerMappings} />
      </Flex>
      {cursors.map((afterMs, index) => (
        <TranscriptPage
          key={`${source}-${afterMs ?? 'start'}`}
          meetingId={meeting.id}
          source={source}
          afterMs={afterMs}
          last={index === cursors.length - 1}
          onLoadMore={(next) => setCursors((current) => [...current, next])}
          onConfirmSpeaker={setConfirming}
          emptyText={EMPTY_TEXT[source]}
        />
      ))}
      <CrudDialog
        open={confirming !== null}
        title={t('Confirm speaker')}
        onClose={() => setConfirming(null)}
      >
        {confirming && (
          <ConfirmSpeakerForm
            meetingId={meeting.id}
            label={confirming}
            onDone={() => setConfirming(null)}
            onCancel={() => setConfirming(null)}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
