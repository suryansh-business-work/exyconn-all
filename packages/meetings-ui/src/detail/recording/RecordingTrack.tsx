import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { formatBytes } from '@exyconn/shell/utils/file';
import {
  useMaRecordingDownloadLinkMutation,
  type MaRecordingQuery,
} from '@exyconn/shell/graphql/generated';
import { formatSeconds } from '../../lib/format';

type Track = MaRecordingQuery['maRecording'][number];

/** What each stream is, in words. An unknown stream is shown by its own name. */
const STREAM_LABELS: Readonly<Record<string, string>> = {
  TAB: 'Meeting audio',
  MIC: 'Your microphone',
};

interface RecordingTrackProps {
  meetingId: string;
  track: Track;
}

/**
 * One saved stream: how long and how large it is, a WAV download, and a player fed the same
 * short-lived signed link (fetched only when someone asks to listen).
 */
export function RecordingTrack({ meetingId, track }: Readonly<RecordingTrackProps>) {
  const t = useT();
  const notify = useNotify();
  const [createLink, { loading }] = useMaRecordingDownloadLinkMutation();
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const label = t(STREAM_LABELS[track.stream] ?? track.stream);

  const fetchUrl = async () => {
    try {
      const result = await createLink({ variables: { meetingId, stream: track.stream } });
      return result.data?.maRecordingDownloadLink.url ?? null;
    } catch (error) {
      notify(errorMessage(error, 'The recording could not be fetched.'), 'error');
      return null;
    }
  };
  const download = async () => {
    const url = await fetchUrl();
    if (url) {
      globalThis.location.assign(url);
    }
  };
  const listen = async () => {
    setPlayUrl(await fetchUrl());
  };

  return (
    <Box sx={panel}>
      <Text weight="semibold" sx={{ display: 'block' }}>
        {label}
      </Text>
      <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('{duration} · {size}', {
          duration: formatSeconds(track.seconds),
          size: formatBytes(track.sizeBytes),
        })}
      </Text>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={download}
          loading={loading}
        >
          {t('Download WAV')}
        </Button>
        {playUrl ? (
          <Box component="audio" controls src={playUrl} aria-label={t('Play {label}', { label })}>
            {/* No caption file exists for a call; the Transcript tab is its text alternative. */}
            <track kind="captions" />
          </Box>
        ) : (
          <Button size="small" startIcon={<PlayArrowIcon />} onClick={listen}>
            {t('Listen')}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
