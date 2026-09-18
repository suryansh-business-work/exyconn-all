import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statCount } from '@exyconn/shell/components/data/tableStats';
import { color } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListItVulnerabilitiesPagedDocument,
  useDeleteItVulnerabilityMutation,
  useListAssetsStatsQuery,
  useListItIncidentsStatsQuery,
  useListItVulnerabilitiesStatsQuery,
  type ListItVulnerabilitiesPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { VulnerabilityForm, type VulnerabilityRow } from './forms/vulnerability';
import { SecurityToolbar } from './SecurityToolbar';
import {
  VULNERABILITY_COLUMNS,
  type PagedVulnerabilityRow,
  type VulnerabilitiesGridContext,
} from './vulnerabilities-grid';

/**
 * IT › Security Center: known vulnerabilities and what is being done about them, endpoint
 * protection across the device register, and the way to security incidents and policies.
 */
export function SecurityPage() {
  const { formatDate } = useSettings();
  const { data: vulnData, refetch: refetchStats } = useListItVulnerabilitiesStatsQuery();
  const { data: assetData } = useListAssetsStatsQuery();
  const { data: incidentData } = useListItIncidentsStatsQuery();
  const [remove] = useDeleteItVulnerabilityMutation();
  const crud = useCrudResource<VulnerabilityRow, PagedVulnerabilityRow>({
    label: 'Vulnerability',
    onDelete: (row) => remove({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete "{title}"?', values: { title: row.title } }),
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListItVulnerabilitiesPagedDocument,
    (data: ListItVulnerabilitiesPagedQuery) => data.listItVulnerabilitiesPaged,
  );

  const vulns = vulnData?.listItVulnerabilitiesStats;
  const assets = assetData?.listAssetsStats;
  const openVulns = statCount(vulns, 'status', 'OPEN') + statCount(vulns, 'status', 'IN_PROGRESS');
  const exposed =
    statCount(assets, 'edrStatus', 'UNPROTECTED') + statCount(assets, 'edrStatus', 'OUTDATED');
  const statItems: StatItem[] = [
    { label: 'Open vulnerabilities', value: String(openVulns), accent: color.amber[500] },
    {
      label: 'Critical',
      value: String(statCount(vulns, 'severity', 'CRITICAL')),
      accent: color.red[500],
    },
    { label: 'Devices unprotected or outdated', value: String(exposed), accent: color.violet[400] },
    {
      label: 'Security incidents',
      value: String(statCount(incidentData?.listItIncidentsStats, 'category', 'SECURITY')),
      accent: color.cyan[600],
    },
  ];

  const gridContext: VulnerabilitiesGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Security Center"
      subtitle="Vulnerabilities, endpoint protection, security incidents and policies"
      entityLabel="vulnerability"
      exportFileName="vulnerabilities"
      permissionModule="ItVulnerability"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <VulnerabilityForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={VULNERABILITY_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by title, CVE, system or owner…"
      toolbar={<SecurityToolbar />}
    />
  );
}
