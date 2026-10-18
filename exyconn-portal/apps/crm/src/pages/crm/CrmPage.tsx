import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { CrudDashboard, useCrudResource } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { statCount, statSum, statTotal } from '@exyconn/shell/components/data/tableStats';
import {
  CrmObject,
  useListLeadsStatsQuery,
  useDeleteLeadMutation,
  SearchLeadsDocument,
  type SearchLeadsQuery,
} from '@exyconn/shell/graphql/generated';
import { LeadForm, type LeadRow } from './forms/lead';
import { ConvertLeadForm } from './forms/convert-lead';
import { LEAD_COLUMNS, type PagedLeadRow, type LeadsGridContext } from './leads-grid';
import { useEmailCheck } from '../../email-verification';
import { color } from '@exyconn/shell/components/ui';
import { RecordListToolbar, useRecordList, withRefreshSignal } from '../../records/list';
import { RecordActions } from '../../records/RecordActions';

/** CRM module — leads & pipeline dashboard with a server-side leads grid. */
export function CrmPage() {
  const t = useT();
  const navigate = useNavigate();
  // Stat cards come from one server aggregation; the grid is server-paged separately.
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats,
  } = useListLeadsStatsQuery();
  const [deleteLead] = useDeleteLeadMutation();
  const [converting, setConverting] = useState<PagedLeadRow | null>(null);
  const crud = useCrudResource<LeadRow, PagedLeadRow>({
    label: 'Lead',
    onDelete: (row) => deleteLead({ variables: { id: row.id } }),
    confirmMessage: (row) => ({ message: 'Delete lead "{name}"?', values: { name: row.name } }),
    refetch: refetchStats,
  });
  // Filters, sorts, columns and saved views: the HubSpot-style list over the search query.
  const records = useRecordList({
    object: CrmObject.Lead,
    document: SearchLeadsDocument,
    select: (data: SearchLeadsQuery) => data.searchLeads,
    columns: LEAD_COLUMNS,
  });

  const stats = statsData?.listLeadsStats;
  const statItems: StatItem[] = [
    { label: 'Leads', value: String(statTotal(stats)), accent: color.blue[400] },
    {
      label: 'Pipeline',
      value: `₹${statSum(stats, 'value').toLocaleString()}`,
      accent: color.green[500],
    },
    { label: 'Won', value: String(statCount(stats, 'stage', 'WON')), accent: color.green[300] },
    { label: 'Lost', value: String(statCount(stats, 'stage', 'LOST')), accent: color.red[200] },
  ];

  const verifyEmail = useEmailCheck(crud.reload);
  const gridContext: LeadsGridContext = {
    actions: { convert: setConverting, edit: crud.openEdit, delete: crud.remove },
    verifyEmail,
  };

  const closeConvert = () => setConverting(null);
  // The deal now exists, so the natural next screen is the pipeline it landed in.
  const onConverted = () => {
    closeConvert();
    navigate('/deals');
  };

  return (
    <CrudDashboard
      key={records.gridKey}
      title="CRM"
      subtitle="Leads & pipeline"
      entityLabel="lead"
      stats={statItems}
      statsLoading={!statsData && statsLoading}
      crud={withRefreshSignal(crud, records.refreshSignal)}
      renderForm={(initial) => (
        <LeadForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={records.columnDefs}
      fetchRows={records.fetchRows}
      bulkList="searchLeads"
      context={gridContext}
      searchPlaceholder="Search leads…"
      initialSearch={records.initialSearch}
      toolbar={
        <RecordListToolbar
          records={records}
          allLabel="All leads"
          renderActions={(query) => (
            <RecordActions
              object={CrmObject.Lead}
              query={query}
              fileName="leads"
              onImported={crud.reload}
            />
          )}
        />
      }
      extraDialogs={
        <CrudDialog open={Boolean(converting)} title={t('Convert lead')} onClose={closeConvert}>
          {converting && (
            <ConvertLeadForm lead={converting} onCancel={closeConvert} onDone={onConverted} />
          )}
        </CrudDialog>
      }
    />
  );
}
