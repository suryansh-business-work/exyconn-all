import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { MaStepStatus, type MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';

interface NoNotesProps {
  meeting: Pick<MaMeetingDetailFragment, 'summaryStatus' | 'summaryError'>;
  onRegenerate: () => void;
}

const WAITING = new Set<MaStepStatus>([MaStepStatus.Queued, MaStepStatus.Running]);

/** No notes yet: why (still being written, failed with a reason, or never started) and a way on. */
export function NoNotes({ meeting, onRegenerate }: Readonly<NoNotesProps>) {
  if (WAITING.has(meeting.summaryStatus)) {
    return (
      <EmptyState
        icon={<AutoAwesomeIcon />}
        title="The AI is writing the notes"
        description="They appear here when the analysis finishes. Refresh in a minute."
      />
    );
  }
  if (meeting.summaryStatus === MaStepStatus.Failed) {
    return (
      <EmptyState
        icon={<AutoAwesomeIcon />}
        title="The notes could not be written"
        description="The analysis failed: {reason}"
        descriptionValues={{ reason: meeting.summaryError }}
        actionLabel="Try again"
        onAction={onRegenerate}
      />
    );
  }
  return (
    <EmptyState
      icon={<AutoAwesomeIcon />}
      title="No AI notes yet"
      description="Generate them from the transcript in the style you need."
      actionLabel="Generate notes"
      onAction={onRegenerate}
    />
  );
}
