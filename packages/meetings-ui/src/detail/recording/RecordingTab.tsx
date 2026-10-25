import MicOffIcon from '@mui/icons-material/MicOff';
import { Flex } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { useMaRecordingQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';
import { RecordingTrack } from './RecordingTrack';

/**
 * The call's saved recording, one track per stream: the meeting tab and the owner's microphone
 * as audio, and the screen recording as video (one track per time it was started).
 */
export function RecordingTab({ meetingId }: Readonly<{ meetingId: string }>) {
  const { data, error, refetch } = useMaRecordingQuery({ variables: { meetingId } });
  if (error) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  if (!data) {
    return <PanelSkeleton />;
  }
  if (data.maRecording.length === 0) {
    return (
      <EmptyState
        icon={<MicOffIcon />}
        title="No recording saved"
        description="Audio and the screen recording are saved only when the owner starts recording and confirms everyone was told — and only while saving recordings is switched on in the settings."
      />
    );
  }
  return (
    <Flex direction="column" spacing={2}>
      {data.maRecording.map((track) => (
        <RecordingTrack key={track.stream} meetingId={meetingId} track={track} />
      ))}
    </Flex>
  );
}
