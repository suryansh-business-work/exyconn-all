import { useFormatters, useT } from '@exyconn/i18n';
import { Chip, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import {
  ColdEmailStatus,
  type ColdEmailDraftRowFieldsFragment,
} from '@exyconn/shell/graphql/generated';

interface ColdEmailDraftsTableProps {
  rows: ColdEmailDraftRowFieldsFragment[];
  loading: boolean;
  onRefresh: () => Promise<unknown>;
  onOpen: (row: ColdEmailDraftRowFieldsFragment) => void;
}

const CLAMP_SX = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  overflowWrap: 'anywhere',
} as const;

/** The record's cold emails, newest first: when, to whom, how many versions and where it stands. */
export function ColdEmailDraftsTable({
  rows,
  loading,
  onRefresh,
  onOpen,
}: Readonly<ColdEmailDraftsTableProps>) {
  const t = useT();
  const { formatDate, formatDateTime } = useFormatters();
  const columns: Column<ColdEmailDraftRowFieldsFragment>[] = [
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => <time dateTime={row.createdAt}>{formatDate(row.createdAt)}</time>,
    },
    { key: 'toEmail', label: 'To' },
    {
      key: 'variantCount',
      label: 'Versions',
      render: (row) => <Chip size="small" variant="outlined" label={row.variantCount} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const sent = row.status === ColdEmailStatus.Sent;
        return (
          <Chip
            size="small"
            color={sent ? 'success' : 'default'}
            label={sent ? t('Sent') : t('Draft')}
          />
        );
      },
    },
    {
      key: 'goal',
      label: 'Offering',
      render: (row) => (
        <Text size="sm" color="text.secondary" sx={CLAMP_SX}>
          {row.goal || t('An introduction')}
        </Text>
      ),
    },
    { key: 'createdByName', label: 'By' },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <time dateTime={row.updatedAt}>{formatDateTime(row.updatedAt)}</time>,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRefresh={onRefresh}
      onRowClick={onOpen}
      emptyMessage='No cold emails yet. Use "Draft a cold email" to write one.'
    />
  );
}
