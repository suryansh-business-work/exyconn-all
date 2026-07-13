import { useState } from 'react';
import { Chip } from '@/components/ui';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { DataTable, type Column } from '../../../components/data/DataTable';
import { StatusChip } from '../../../components/data/StatusChip';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { ModuleDashboard } from '../../../components/dashboard/ModuleDashboard';
import type { StatItem } from '../../../components/dashboard/StatCard';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useSettings } from '../../../hooks/useSettings';
import { useListContractsQuery } from '../../../graphql/generated';
import { SignContractForm } from './forms/sign-contract';
import type { ContractRow } from './forms/contract';

/** Legal → Sign Board: sign contracts and track who signed them. */
export function SignBoardPage() {
  const { data, loading, refetch } = useListContractsQuery();
  const [signTarget, setSignTarget] = useState<ContractRow | null>(null);
  const notify = useNotify();
  const { formatDate } = useSettings();

  const rows = data?.listContracts ?? [];
  const signed = rows.filter((r) => r.signedBy);
  const stats: StatItem[] = [
    { label: 'Total', value: String(rows.length), accent: '#4f8cff' },
    { label: 'Signed', value: String(signed.length), accent: '#22c55e' },
    { label: 'Awaiting', value: String(rows.length - signed.length), accent: '#f59e0b' },
  ];

  const columns: Column<ContractRow>[] = [
    { key: 'title', label: 'Title' },
    { key: 'party', label: 'Party' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    {
      key: 'signedBy',
      label: 'Signature',
      render: (r) =>
        r.signedBy ? (
          <Chip
            size="small"
            color="success"
            label={`${r.signedBy} · ${r.signedAt ? formatDate(r.signedAt) : ''}`}
          />
        ) : (
          <Chip size="small" variant="outlined" label="Unsigned" />
        ),
    },
  ];

  return (
    <ModuleDashboard title="Sign Board" subtitle="Sign & track contract signatures" stats={stats}>
      <DataTable
        columns={columns}
        rows={rows}
        actions={[
          {
            icon: <HistoryEduIcon fontSize="small" />,
            tooltip: 'Sign',
            ariaLabel: 'sign contract',
            color: 'primary',
            onClick: setSignTarget,
          },
        ]}
        emptyMessage={loading ? 'Loading…' : 'No contracts to sign.'}
      />
      <CrudDialog
        open={Boolean(signTarget)}
        title="Sign contract"
        onClose={() => setSignTarget(null)}
      >
        {signTarget && (
          <SignContractForm
            contract={signTarget}
            onCancel={() => setSignTarget(null)}
            onDone={() => {
              void refetch();
              setSignTarget(null);
              notify('Signature recorded');
            }}
          />
        )}
      </CrudDialog>
    </ModuleDashboard>
  );
}
