import { useMemo, useState } from 'react';
import { Box, Flex, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { DataTable } from '@exyconn/shell/components/data/DataTable';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useProjectTasksQuery } from '@exyconn/shell/graphql/generated';
import { TicketDialog, TICKET_TYPES } from '../ticket';
import type { TicketRow } from '../forms/ticket';
import { ticketColumns } from './ticket-columns';

const ANY = '';

interface ProjectTicketsPageProps {
  projectId: string;
}

/**
 * Every ticket in the project as a table — the same rows the board holds, read the way a
 * list is read: newest first, filtered by a word, a type or an assignee. Opening a row opens
 * the same ticket dialog the board opens, so there is one ticket screen, not two.
 */
export function ProjectTicketsPage({ projectId }: Readonly<ProjectTicketsPageProps>) {
  const { formatDate } = useSettings();
  const { data, refetch } = useProjectTasksQuery({
    variables: { projectId },
    fetchPolicy: 'cache-and-network',
  });
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>(ANY);
  const [assignee, setAssignee] = useState<string>(ANY);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows: TicketRow[] = useMemo(() => data?.projectTasks ?? [], [data]);

  const assignees = useMemo(
    () => [...new Set(rows.map((row) => row.assigneeName).filter((name) => name !== ''))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesText =
        needle === '' ||
        row.title.toLowerCase().includes(needle) ||
        row.key.toLowerCase().includes(needle);
      const matchesType = type === ANY || row.type === type;
      const matchesAssignee = assignee === ANY || row.assigneeName === assignee;
      return matchesText && matchesType && matchesAssignee;
    });
  }, [rows, search, type, assignee]);

  const openTicket = rows.find((row) => row.id === openId) ?? null;

  return (
    <Box>
      <Flex direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Summary or key…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          label="Type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value={ANY}>All types</MenuItem>
          {Object.entries(TICKET_TYPES).map(([value, facet]) => (
            <MenuItem key={value} value={value}>
              {facet.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Assignee"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value={ANY}>Anyone</MenuItem>
          {assignees.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      </Flex>

      <DataTable
        columns={ticketColumns(formatDate)}
        rows={filtered}
        onRowClick={(row) => setOpenId(row.id)}
        emptyMessage="No tickets match."
      />

      <TicketDialog
        ticket={openTicket}
        onClose={() => setOpenId(null)}
        onChanged={() => {
          refetch().catch(() => undefined);
        }}
      />
    </Box>
  );
}
