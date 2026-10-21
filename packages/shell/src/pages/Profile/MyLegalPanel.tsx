import { useState } from 'react';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Box, Heading, Text } from '@/components/ui';
import { DataTable, type Column, type RowAction } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { readingPanel } from '@/components/glass/glass';
import { LEGAL_KIND_LABELS } from '@/components/legal';
import { useSettings } from '@/hooks/useSettings';
import {
  useMyLegalAssignmentsQuery,
  type LegalAssignmentFieldsFragment,
} from '@/graphql/generated';
import { LegalReaderDialog } from './LegalReaderDialog';

type AssignmentRow = LegalAssignmentFieldsFragment;

/** The contracts, policies and documents HR or Legal handed to the signed-in person. */
export function MyLegalPanel() {
  const t = useT();
  const { formatDate } = useSettings();
  const { data, loading, error, refetch } = useMyLegalAssignmentsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [reading, setReading] = useState<AssignmentRow | null>(null);
  const rows = data?.myLegalAssignments ?? [];

  const actions: RowAction<AssignmentRow>[] = [
    {
      icon: <MenuBookIcon fontSize="small" />,
      tooltip: 'Read',
      ariaLabel: 'read',
      onClick: setReading,
      hidden: (row) => !row.hasBody,
    },
    {
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: 'Open the file',
      ariaLabel: 'open the file',
      onClick: (row) => globalThis.open(row.fileUrl, '_blank', 'noopener,noreferrer'),
      hidden: (row) => row.fileUrl === '',
    },
  ];

  const columns: Column<AssignmentRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'kind', label: 'Type', render: (r) => t(LEGAL_KIND_LABELS[r.kind].one) },
    { key: 'groupName', label: 'Group', render: (r) => r.groupName ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'assignedAt', label: 'Assigned', render: (r) => formatDate(r.assignedAt) },
  ];

  return (
    <Box sx={readingPanel}>
      <Heading level={6}>{t('My contracts, policies & documents')}</Heading>
      <Text component="p" size="sm" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
        {t('Handed to you by HR or Legal. Read them here or open the attached file.')}
      </Text>
      {error && <Text color="error">{error.message}</Text>}
      <DataTable
        columns={columns}
        rows={[...rows]}
        actions={actions}
        emptyMessage="Nothing has been handed to you yet."
        loading={loading}
        onRefresh={refetch}
      />
      <LegalReaderDialog assignment={reading} onClose={() => setReading(null)} />
    </Box>
  );
}
