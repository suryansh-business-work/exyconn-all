import { useT } from '@exyconn/i18n';
import { Avatar, Chip, Flex, Text, fontSize } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { TICKET_PRIORITIES, TICKET_TYPES, TicketFacetIcon, initialsOf } from '../ticket';
import type { TicketRow } from '../forms/ticket';

/** The translator, so the module-scope column model can be given the page's own `t`. */
type Translate = ReturnType<typeof useT>;

/** The ticket list's columns. Built as a function so the date format follows the settings. */
export function ticketColumns(
  formatDate: (value: string) => string,
  t: Translate,
): Column<TicketRow>[] {
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
        <Flex direction="row" alignItems="center" spacing={1}>
          <TicketFacetIcon facet={TICKET_TYPES[row.type]} kind="Type" decorative />
          <Text size="sm">{t(TICKET_TYPES[row.type].label)}</Text>
        </Flex>
      ),
    },
    { key: 'title', label: 'Summary' },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => (
        <Flex direction="row" alignItems="center" spacing={1}>
          <TicketFacetIcon facet={TICKET_PRIORITIES[row.priority]} kind="Priority" decorative />
          <Text size="sm">{t(TICKET_PRIORITIES[row.priority].label)}</Text>
        </Flex>
      ),
    },
    {
      key: 'assigneeName',
      label: 'Assignee',
      render: (row) =>
        row.assigneeName === '' ? (
          <Text size="sm" color="text.secondary">
            {t('Unassigned')}
          </Text>
        ) : (
          <Flex direction="row" alignItems="center" spacing={1}>
            <Avatar alt="" aria-hidden sx={{ width: 22, height: 22, fontSize: fontSize['3xs'] }}>
              {initialsOf(row.assigneeName)}
            </Avatar>
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
