import { useMemo, useState } from 'react';
import { usePagedFetcher } from '@exyconn/crud';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  TechVaultSessionsPagedDocument,
  type TechVaultSessionsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { VaultSessionDetails } from './VaultSessionDetails';
import {
  VAULT_HISTORY_COLUMNS,
  type VaultHistoryContext,
  type VaultSessionRow,
} from './vault-history-grid';

/** Environment Variables > Access history: every unlock, by whom, why and from where. */
export function VaultHistoryPanel() {
  const t = useT();
  const { formatDateTime } = useSettings();
  const [open, setOpen] = useState<VaultSessionRow | null>(null);
  const fetchRows = usePagedFetcher(
    TechVaultSessionsPagedDocument,
    (data: TechVaultSessionsPagedQuery) => data.techVaultSessionsPaged,
  );
  const context = useMemo<VaultHistoryContext>(
    () => ({ actions: { details: setOpen }, formatDateTime }),
    [formatDateTime],
  );

  return (
    <Box>
      <PageHeader
        title="Access history"
        subtitle="Every unlock of Environment Variables: who, when, why, the IP address, browser and location — and what they changed or revealed while it was open."
      />
      <ServerDataGrid
        columnDefs={VAULT_HISTORY_COLUMNS}
        fetchRows={fetchRows}
        context={context}
        onRowClick={setOpen}
        searchPlaceholder="Search by person, reason or IP…"
      />
      <CrudDialog open={open !== null} title={t('Unlock session')} onClose={() => setOpen(null)}>
        {open && <VaultSessionDetails session={open} />}
      </CrudDialog>
    </Box>
  );
}
