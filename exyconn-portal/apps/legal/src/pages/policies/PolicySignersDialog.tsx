import { Dialog, DialogContent, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { usePolicyAcknowledgementsQuery } from '@exyconn/shell/graphql/generated';
import type { PagedPolicyRow } from './policies-grid';

interface Props {
  policy: PagedPolicyRow | null;
  onClose: () => void;
}

type SignerRow = {
  id: string;
  version: number;
  userName: string;
  userEmail: string;
  signedName: string;
  signedAt: string;
};

/**
 * Who has signed, and which version they signed.
 *
 * The version column is the point: a signature on v1 is not consent to v2, and a list that
 * hid the version would let "everybody has signed" quietly mean "everybody signed something
 * we have since rewritten".
 */
export function PolicySignersDialog({ policy, onClose }: Readonly<Props>) {
  const { formatDateTime } = useSettings();
  const { data, loading } = usePolicyAcknowledgementsQuery({
    variables: { policyId: policy?.id ?? '' },
    skip: policy === null,
    fetchPolicy: 'cache-and-network',
  });

  if (policy === null) {
    return null;
  }

  const columns: Column<SignerRow>[] = [
    { key: 'userName', label: 'Name', render: (row) => row.userName || row.userEmail },
    { key: 'signedName', label: 'Signed as' },
    { key: 'version', label: 'Version', render: (row) => `v${row.version}` },
    { key: 'signedAt', label: 'Signed', render: (row) => formatDateTime(row.signedAt) },
  ];

  const rows = (data?.policyAcknowledgements ?? []) as SignerRow[];

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth aria-label="Who has signed">
      <DialogContent>
        <Text size="lg" weight="bold" component="div">
          {policy.title}
        </Text>
        <Text size="caption" color="text.secondary" component="div" sx={{ mb: 2 }}>
          Currently v{policy.version} · {policy.acknowledgedCount} have signed this version
        </Text>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? 'Loading…' : 'Nobody has signed this policy yet.'}
        />
      </DialogContent>
    </Dialog>
  );
}
