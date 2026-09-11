import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { AppLogEventFieldsFragment } from '@exyconn/shell/graphql/generated';

interface Props {
  events: readonly AppLogEventFieldsFragment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function deviceOf(event: AppLogEventFieldsFragment): string {
  return [event.platform, event.osVersion, event.deviceModel].filter(Boolean).join(' ') || '—';
}

/** The most recent occurrences, newest first. Picking one shows its stack and breadcrumbs. */
export function OccurrencesTable({ events, selectedId, onSelect }: Readonly<Props>) {
  const { formatDateTime } = useSettings();
  return (
    <TableContainer sx={{ maxHeight: 280 }}>
      <Table size="small" stickyHeader aria-label="Recent occurrences">
        <TableHead>
          <TableRow>
            <TableCell>When</TableCell>
            <TableCell>Who</TableCell>
            <TableCell>Device</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Screen / page</TableCell>
            <TableCell align="right">Times</TableCell>
            <TableCell>IP</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} selected={event.id === selectedId}>
              <TableCell>
                <Button size="small" onClick={() => onSelect(event.id)}>
                  {formatDateTime(event.occurredAt)}
                </Button>
              </TableCell>
              <TableCell>
                {event.userName || event.userEmail || 'Anonymous'}
                {event.userId && !event.userVerified && (
                  <Chip size="small" label="unverified" sx={{ ml: 1 }} />
                )}
              </TableCell>
              <TableCell>{deviceOf(event)}</TableCell>
              <TableCell>{event.appVersion || '—'}</TableCell>
              <TableCell>{event.route || '—'}</TableCell>
              <TableCell align="right">{event.count}</TableCell>
              <TableCell>{event.ip || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
