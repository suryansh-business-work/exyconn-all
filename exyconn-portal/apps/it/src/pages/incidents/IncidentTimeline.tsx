import { useT } from '@exyconn/i18n';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { IncidentUpdateForm } from './forms/incident-update';
import type { PagedIncidentRow } from './incidents-grid';

interface IncidentTimelineProps {
  incident: PagedIncidentRow | null;
  onClose: () => void;
  onChanged: () => void;
}

/** Everything that happened, oldest first — the record a post-incident review starts from. */
function TimelineEntries({ incident }: Readonly<{ incident: PagedIncidentRow }>) {
  const { formatDateTime } = useSettings();
  return (
    <Stack spacing={1.5}>
      {incident.timeline.map((entry) => (
        <Stack key={entry.id} spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip value={entry.status} />
            <Text size="caption" color="text.secondary">
              {formatDateTime(entry.at)} · {entry.authorName}
            </Text>
          </Stack>
          <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
            {entry.note}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}

/** One incident in full: its facts, its timeline, and a box to post the next update. */
export function IncidentTimeline({
  incident,
  onClose,
  onChanged,
}: Readonly<IncidentTimelineProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  if (!incident) {
    return null;
  }
  const resolved = incident.resolvedAt ? formatDateTime(incident.resolvedAt) : '—';
  return (
    <CrudDialog open title={incident.title} onClose={onClose}>
      <Stack spacing={2}>
        <DetailFactGrid>
          <DetailFact label="Severity">
            <StatusChip value={incident.severity} />
          </DetailFact>
          <DetailFact label="Status">
            <StatusChip value={incident.status} />
          </DetailFact>
          <DetailFact label="Started">{formatDateTime(incident.startedAt)}</DetailFact>
          <DetailFact label="Resolved">{resolved}</DetailFact>
          <DetailFact label="Commander">{incident.commanderName || '—'}</DetailFact>
          <DetailFact label="Affected">{incident.affectedSystems.join(', ') || '—'}</DetailFact>
        </DetailFactGrid>
        <Text size="sm">{incident.impact || incident.description}</Text>
        <Divider />
        <Text size="overline" color="text.secondary">
          {t('Timeline')}
        </Text>
        <TimelineEntries incident={incident} />
        <Divider />
        <IncidentUpdateForm
          incidentId={incident.id}
          status={incident.status}
          onCancel={onClose}
          onDone={onChanged}
        />
      </Stack>
    </CrudDialog>
  );
}
