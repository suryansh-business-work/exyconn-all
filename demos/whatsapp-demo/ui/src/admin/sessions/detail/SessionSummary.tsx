import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Typography } from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { formatDemoDuration } from '../../shared/duration';
import { deviceLabel, type SessionRow } from '../session.columns';

interface SessionSummaryProps {
  session: SessionRow;
  industryName: (demoKey: string) => string;
}

/** Who ran the session, when, for how long, on what, and what they got through. */
export function SessionSummary({ session, industryName }: Readonly<SessionSummaryProps>) {
  const t = useT();
  const { formatDateTime, formatNumber, formatList } = useFormatters();
  const device = session.viewport
    ? `${deviceLabel(session.device, t)} (${session.viewport})`
    : deviceLabel(session.device, t);
  const industries = session.demos.map((demoKey) => industryName(demoKey));

  return (
    <Box>
      <Typography variant="subtitle1" component="p" sx={{ overflowWrap: 'anywhere' }}>
        {session.userName}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, overflowWrap: 'anywhere' }}>
        {session.userEmail}
      </Typography>
      <DetailFactGrid>
        <DetailFact label="Started">{formatDateTime(session.startedAt)}</DetailFact>
        <DetailFact label="Last activity">{formatDateTime(session.lastEventAt)}</DetailFact>
        <DetailFact label="Duration">{formatDemoDuration(session.durationMs)}</DetailFact>
        <DetailFact label="Device">{device}</DetailFact>
        <DetailFact label="Industries opened">
          {industries.length > 0 ? formatList(industries) : '—'}
        </DetailFact>
        <DetailFact label="Flows">
          {t('{started} started, {completed} completed', {
            started: formatNumber(session.flowsStarted),
            completed: formatNumber(session.flowsCompleted),
          })}
        </DetailFact>
        <DetailFact label="Events">{formatNumber(session.events)}</DetailFact>
        <DetailFact label="Status">
          <StatusChip value={session.status} />
        </DetailFact>
      </DetailFactGrid>
    </Box>
  );
}
