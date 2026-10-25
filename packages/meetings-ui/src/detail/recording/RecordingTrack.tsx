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
  SCREEN: 'Screen recording',
};
/** Each restart of the screen recording is its own track: SCREEN_2, SCREEN_3… */
const SCREEN_PART_PREFIX = 'SCREEN_';

const isScreen = (stream: string) => stream === 'SCREEN' || stream.startsWith(SCREEN_PART_PREFIX);

function useTrackLabel(stream: string): string {
  const t = useT();
  if (stream.startsWith(SCREEN_PART_PREFIX)) {
    return t('Screen recording (part {part})', {
      part: stream.slice(SCREEN_PART_PREFIX.length),
    });
  }
  return t(STREAM_LABELS[stream] ?? stream);
}

interface PlayerProps {
  src: string;
  label: string;
  video: boolean;
}

/** The track's player: video for the screen recording, audio for the rest. */
function Player({ src, label, video }: Readonly<PlayerProps>) {
  const t = useT();
  const name = t('Play {label}', { label });
  // No caption file exists for a call; the Transcript tab is its text alternative.
  if (video) {
    return (
      <Box
        component="video"
        controls
        src={src}
        aria-label={name}
        sx={{ display: 'block', width: '100%', maxWidth: '100%', borderRadius: 1 }}
      >
        <track kind="captions" />
      </Box>
    );
  }
  return (
    <Box component="audio" controls src={src} aria-label={name}>
      <track kind="captions" />
    </Box>
  );
}

interface RecordingTrackProps {
  meetingId: string;
  track: Track;
}

/**
 * One saved stream: how long and how large it is, a download (WAV for audio, WebM for the
 * screen recording), and a player fed the same short-lived signed link (fetched only when
 * someone asks to play it).
 */
export function RecordingTrack({ meetingId, track }: Readonly<RecordingTrackProps>) {
  const t = useT();
  const notify = useNotify();
  const [createLink, { loading }] = useMaRecordingDownloadLinkMutation();
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const label = useTrackLabel(track.stream);
  const video = isScreen(track.stream);

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
          {video ? t('Download video') : t('Download WAV')}
        </Button>
        {playUrl ? (
          <Player src={playUrl} label={label} video={video} />
        ) : (
          <Button size="small" startIcon={<PlayArrowIcon />} onClick={listen}>
            {video ? t('Watch') : t('Listen')}
          </Button>
        )}
      </Flex>
    </Box>
  );
}
