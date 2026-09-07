import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { Flex, Text } from '@exyconn/shell/components/ui';
import {
  useAudienceMembersQuery,
  type AudienceMembersQuery,
} from '@exyconn/shell/graphql/generated';

type MemberRow = AudienceMembersQuery['audienceMembers'][number];

const COLUMNS: Column<MemberRow>[] = [
  { key: 'name', label: 'Name', render: (row) => row.name || row.email },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company', render: (row) => row.company || '—' },
  { key: 'kind', label: 'From', render: (row) => <StatusChip value={row.kind} /> },
  { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
];

interface AudienceMembersProps {
  audienceId: string;
  audienceName: string;
}

/**
 * Who an audience actually reaches right now.
 *
 * The grid can only show how many names were typed into the list; a segment adds people
 * nobody typed, and the same person in two sources is one recipient. This asks the server
 * the same question the send asks, so the count on screen is the count that will be mailed.
 */
export function AudienceMembers({ audienceId, audienceName }: Readonly<AudienceMembersProps>) {
  const { data, loading } = useAudienceMembersQuery({ variables: { id: audienceId } });
  const members = data?.audienceMembers ?? [];

  return (
    <Flex direction="column" spacing={1}>
      <Text size="sm" color="text.secondary">
        “{audienceName}” reaches {members.length} recipient(s), de-duplicated by address.
      </Text>
      <DataTable
        columns={COLUMNS}
        rows={members}
        emptyMessage={loading ? 'Loading…' : 'Nobody matches this audience yet.'}
      />
    </Flex>
  );
}
