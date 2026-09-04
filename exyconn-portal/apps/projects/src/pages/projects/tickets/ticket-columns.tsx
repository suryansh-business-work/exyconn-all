import { Avatar, Chip, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { TICKET_PRIORITIES, TICKET_TYPES, TicketFacetIcon, initialsOf } from '../ticket';
import type { TicketRow } from '../forms/ticket';

/** The ticket list's columns. Built as a function so the date format follows the settings. */
export function ticketColumns(formatDate: (value: string) => string): Column<TicketRow>[] {
  return [
    {
      key: 'key',
      label: 'Key',
      render: (row) => (
        <Text size="sm" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {row.key}
        </Text>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Flex direction="row" alignItems="center" spacing={0.75}>
          <TicketFacetIcon facet={TICKET_TYPES[row.type]} kind="Type" />
          <Text size="sm">{TICKET_TYPES[row.type].label}</Text>
        </Flex>
      ),
    },
    { key: 'title', label: 'Summary' },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <Flex direction="row" alignItems="center" spacing={0.75}>
          <TicketFacetIcon facet={TICKET_PRIORITIES[row.priority]} kind="Priority" />
          <Text size="sm">{TICKET_PRIORITIES[row.priority].label}</Text>
        </Flex>
      ),
    },
    {
      key: 'assigneeName',
      label: 'Assignee',
      render: (row) =>
        row.assigneeName === '' ? (
          <Text size="sm" color="text.secondary">
            Unassigned
          </Text>
        ) : (
          <Flex direction="row" alignItems="center" spacing={0.75}>
            <Tooltip title={row.assigneeName}>
              <Avatar sx={{ width: 22, height: 22, fontSize: 10 }}>
                {initialsOf(row.assigneeName)}
              </Avatar>
            </Tooltip>
            <Text size="sm">{row.assigneeName}</Text>
          </Flex>
        ),
    },
    {
      key: 'storyPoints',
      label: 'Points',
      render: (row) => (row.storyPoints === null ? '—' : String(row.storyPoints)),
    },
    {
      key: 'labels',
      label: 'Labels',
      render: (row) =>
        row.labels.length === 0 ? (
          '—'
        ) : (
          <Flex direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
            {row.labels.map((label) => (
              <Chip key={label} size="small" variant="outlined" label={label} />
            ))}
          </Flex>
        ),
    },
    {
      key: 'dueDate',
      label: 'Due',
      render: (row) => (row.dueDate ? formatDate(row.dueDate) : '—'),
    },
  ];
}
