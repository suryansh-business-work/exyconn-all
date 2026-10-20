import { useFormatters, useT } from '@exyconn/i18n';
import { Link } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';
import { formatSeconds } from '../../lib/format';

/** USD to the cent, as AI spend is shown everywhere in the portal. */
const USD = { currency: 'USD' } as const;

/** Everything recorded about the call, times in the viewer's own timezone. */
export function MeetingFacts({ meeting }: Readonly<{ meeting: MaMeetingDetailFragment }>) {
  const t = useT();
  const { formatDateTime, formatCurrency, formatList, formatNumber } = useFormatters();
  const ended = meeting.endedAt ? formatDateTime(meeting.endedAt) : t('Still in progress');
  const consent = meeting.consentRecordedAt
    ? t('Confirmed {when}', { when: formatDateTime(meeting.consentRecordedAt) })
    : t('Not confirmed');
  const detected = meeting.detectedLanguages.length
    ? formatList(meeting.detectedLanguages)
    : t('None yet');
  return (
    <DetailFactGrid>
      <DetailFact label="Started">{formatDateTime(meeting.startedAt)}</DetailFact>
      <DetailFact label="Ended">{ended}</DetailFact>
      <DetailFact label="Duration">{formatSeconds(meeting.durationSeconds)}</DetailFact>
      <DetailFact label="Organizer">{meeting.organizerName ?? meeting.ownerName}</DetailFact>
      <DetailFact label="Recorded by">{meeting.ownerName}</DetailFact>
      <DetailFact label="Language">
        <StatusChip value={meeting.language} />
      </DetailFact>
      <DetailFact label="Detected languages">{detected}</DetailFact>
      <DetailFact label="Call timezone">{meeting.timezone}</DetailFact>
      <DetailFact label="Transcription">
        <StatusChip value={meeting.transcriptionState} />
      </DetailFact>
      <DetailFact label="Capture">
        <StatusChip value={meeting.captureState} />
      </DetailFact>
      <DetailFact label="Participants told">{consent}</DetailFact>
      <DetailFact label="Transcript lines">{formatNumber(meeting.segmentCount)}</DetailFact>
      <DetailFact label="Transcription failures">
        {formatNumber(meeting.transcriptionFailures)}
      </DetailFact>
      <DetailFact label="AI cost">{formatCurrency(meeting.costUsd, USD)}</DetailFact>
      <DetailFact label="Meeting code">
        <Link href={meeting.url} target="_blank" rel="noopener noreferrer">
          {meeting.meetingCode}
        </Link>
      </DetailFact>
    </DetailFactGrid>
  );
}
