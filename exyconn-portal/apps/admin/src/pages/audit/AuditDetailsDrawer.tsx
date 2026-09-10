import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { parseAuditChanges, type AuditChangeRow } from './audit-changes';
import type { PagedAuditRow } from './audit-grid';

interface FactProps {
  label: string;
  value: string;
}

/** One labelled line of the entry — who, when, where. */
function Fact({ label, value }: Readonly<FactProps>) {
  return (
    <Box>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
      <Text size="sm" sx={{ wordBreak: 'break-word' }}>
        {value || '—'}
      </Text>
    </Box>
  );
}

/** The from/to table for an update; nothing for any other action. */
function ChangesTable({ rows }: Readonly<{ rows: AuditChangeRow[] }>) {
  if (rows.length === 0) {
    return null;
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="changed fields">
        <TableHead>
          <TableRow>
            <TableCell>Field</TableCell>
            <TableCell>From</TableCell>
            <TableCell>To</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.field}>
              <TableCell sx={{ fontWeight: 600 }}>{row.field}</TableCell>
              <TableCell sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                {row.from}
              </TableCell>
              <TableCell sx={{ wordBreak: 'break-word' }}>{row.to}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

interface AuditDetailsDrawerProps {
  row: PagedAuditRow | null;
  onClose: () => void;
  formatDateTime: (value: string) => string;
}

/** One audit entry in full: what happened, who did it, and — for an update — what changed. */
export function AuditDetailsDrawer({
  row,
  onClose,
  formatDateTime,
}: Readonly<AuditDetailsDrawerProps>) {
  if (!row) {
    return null;
  }
  const actor = row.actorName ? `${row.actorName} (${row.actorEmail})` : row.actorEmail;
  const entity = row.entityLabel ? `${row.entityLabel} · ${row.entityId}` : row.entityId;

  return (
    <CrudDialog open title="Audit details" onClose={onClose}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{
          alignItems: "center"
        }}>
          <StatusChip value={row.action} />
          <Text size="sm" color="text.secondary">
            {row.module}
          </Text>
        </Stack>
        <Text size="sm">{row.summary}</Text>
        <Fact label="Actor" value={actor} />
        <Fact label="When" value={formatDateTime(row.createdAt)} />
        <Fact label="Entity" value={entity} />
        <Fact label="IP address" value={row.ip} />
        <ChangesTable rows={parseAuditChanges(row.changes)} />
      </Stack>
    </CrudDialog>
  );
}
