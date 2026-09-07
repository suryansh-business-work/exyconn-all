import { useState } from 'react';
import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { statCount, statTotal } from '@exyconn/shell/components/data/tableStats';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ApplicantStage,
  ListApplicantsPagedDocument,
  useDeleteApplicantMutation,
  useListApplicantsStatsQuery,
  type ListApplicantsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ApplicantForm, type ApplicantRow } from './forms/applicant';
import { ApplicantStageForm } from './forms/applicant-stage';
import { ApplicantDetailDialog } from './ApplicantDetailDialog';
import { ApplicantQuickFilter, stageFilters, type StageFilter } from './ApplicantQuickFilter';
import { STAGE_ACCENTS } from './applicants.constants';
import {
  APPLICANT_COLUMNS,
  type ApplicantsGridContext,
  type PagedApplicantRow,
} from './applicants-grid';

/** The tiles above the grid: the whole pipeline, then the stages that need a decision. */
const TILE_STAGES = [
  ApplicantStage.New,
  ApplicantStage.Screening,
  ApplicantStage.Interview,
  ApplicantStage.Offer,
  ApplicantStage.Hired,
];

/**
 * HR › Applicants: everyone who applied through the website or was added by hand,
 * moved through the pipeline one stage at a time. The quick filter above the grid adds
 * a server filter to every page request.
 */
export function ApplicantsPage() {
  const { formatDate } = useSettings();
  const { data: statsData, refetch: refetchStats } = useListApplicantsStatsQuery();
  const [deleteApplicant] = useDeleteApplicantMutation();
  const [stage, setStage] = useState<StageFilter>('all');
  const [advancing, setAdvancing] = useState<PagedApplicantRow | null>(null);
  const [viewing, setViewing] = useState<PagedApplicantRow | null>(null);

  const crud = useCrudResource<ApplicantRow, PagedApplicantRow>({
    label: 'Applicant',
    onDelete: (row) => deleteApplicant({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete applicant "${row.name}"?`,
    refetch: refetchStats,
  });
  const fetchRows = usePagedFetcher(
    ListApplicantsPagedDocument,
    (data: ListApplicantsPagedQuery) => data.listApplicantsPaged,
    stageFilters(stage),
  );

  const changeStage = (next: StageFilter) => {
    setStage(next);
    crud.reload();
  };

  const stats = statsData?.listApplicantsStats;
  const statItems: StatItem[] = [
    { label: 'Applicants', value: String(statTotal(stats)), accent: '#64748b' },
    ...TILE_STAGES.map((tile) => ({
      label: tile.charAt(0) + tile.slice(1).toLowerCase(),
      value: String(statCount(stats, 'stage', tile)),
      accent: STAGE_ACCENTS[tile],
    })),
  ];

  const gridContext: ApplicantsGridContext = {
    actions: {
      advance: setAdvancing,
      details: setViewing,
      edit: crud.openEdit,
      delete: crud.remove,
    },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Applicants"
      subtitle="Everyone in the hiring pipeline, from the website and from referrals"
      entityLabel="applicant"
      stats={statItems}
      crud={crud}
      renderForm={(initial) => (
        <ApplicantForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={APPLICANT_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search by name, email or job…"
      toolbar={<ApplicantQuickFilter value={stage} onChange={changeStage} />}
      extraDialogs={
        <>
          <ApplicantDetailDialog applicant={viewing} onClose={() => setViewing(null)} />
          <CrudDialog
            open={Boolean(advancing)}
            title="Advance stage"
            onClose={() => setAdvancing(null)}
          >
            {advancing && (
              <ApplicantStageForm
                applicant={advancing}
                onCancel={() => setAdvancing(null)}
                onDone={() => {
                  setAdvancing(null);
                  crud.reload();
                }}
              />
            )}
          </CrudDialog>
        </>
      }
    />
  );
}
