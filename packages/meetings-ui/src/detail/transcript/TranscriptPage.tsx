import { useT } from '@exyconn/i18n';
import { Box, Button, Skeleton } from '@exyconn/shell/components/ui';
import { MaTranscriptSource, useMaTranscriptQuery } from '@exyconn/shell/graphql/generated';
import { LoadError } from '../../lib/LoadError';
import { TranscriptLine } from './TranscriptLine';

/** Lines fetched per "Load more" — the server caps a slice at 500. */
export const TRANSCRIPT_PAGE_SIZE = 200;

interface TranscriptPageProps {
  meetingId: string;
  source: MaTranscriptSource;
  /** Lines after this offset; null for the start of the call. */
  afterMs: number | null;
  /** True for the newest page: only it offers "Load more". */
  last: boolean;
  onLoadMore: (afterMs: number) => void;
  onConfirmSpeaker: (label: string) => void;
  /** Shown when the very first page comes back empty. */
  emptyText: string;
}

/** One slice of the transcript, in time order. */
export function TranscriptPage({
  meetingId,
  source,
  afterMs,
  last,
  onLoadMore,
  onConfirmSpeaker,
  emptyText,
}: Readonly<TranscriptPageProps>) {
  const t = useT();
  const { data, error, refetch } = useMaTranscriptQuery({
    variables: { meetingId, source, afterMs, limit: TRANSCRIPT_PAGE_SIZE },
  });
  if (error) {
    return <LoadError message={error.message} onRetry={() => refetch()} />;
  }
  if (!data) {
    return <Skeleton variant="rounded" height={120} />;
  }
  const segments = data.maTranscript;
  const lastSegment = segments.at(-1);
  if (!lastSegment) {
    return afterMs === null ? (
      <Box sx={{ color: 'text.secondary', py: 2 }}>{t(emptyText)}</Box>
    ) : null;
  }
  return (
    <>
      <Box component="ol" sx={{ p: 0, m: 0 }}>
        {segments.map((segment) => (
          <TranscriptLine key={segment.id} segment={segment} onConfirmSpeaker={onConfirmSpeaker} />
        ))}
      </Box>
      {last && segments.length === TRANSCRIPT_PAGE_SIZE && (
        <Button variant="outlined" onClick={() => onLoadMore(lastSegment.startMs)} sx={{ mt: 1 }}>
          {t('Load more')}
        </Button>
      )}
    </>
  );
}
