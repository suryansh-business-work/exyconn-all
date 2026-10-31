import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  DealStage,
  useListDealsQuery,
  useSetDealStageMutation,
} from '@exyconn/shell/graphql/generated';
import { DealForm, type DealRow } from './forms/deal';
import { DealScorePanel } from './score/DealScorePanel';
import { DealBoardSkeleton } from './DealBoardSkeleton';
import { DealBoard } from './DealBoard';
import { DealsViewToggle } from './DealsViewToggle';
import { PIPELINE_STAGES, stageLabel } from './deals.constants';

/**
 * CRM → Deals: the pipeline as a board, where moving a deal is one drag. There is
 * no delete here on purpose — a deal that goes nowhere is moved to Lost, which is
 * information, rather than removed, which is not.
 */
export function DealsPage() {
  const t = useT();
  const notify = useNotify();
  const { data, loading, refetch } = useListDealsQuery({ fetchPolicy: 'cache-and-network' });
  const [setStage] = useSetDealStageMutation();
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [creating, setCreating] = useState(false);

  const deals = useMemo(() => data?.listDeals ?? [], [data]);
  const move = async (dealId: string, stage: DealStage) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === stage) {
      return;
    }
    try {
      await setStage({ variables: { id: dealId, stage } });
      notify('"{title}" moved to {stage}', 'success', {
        title: deal.title,
        stage: t(stageLabel(stage)),
      });
      await refetch();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not move the deal', 'error');
    }
  };

  const close = () => {
    setEditing(null);
    setCreating(false);
  };
  const done = () => {
    close();
    refetch().catch(() => undefined);
  };

  if (creating || Boolean(editing)) {
    return (
      <CrudFormPage
        title={editing ? 'Edit deal' : 'New deal'}
        onBack={close}
        backLabel="Back to Deals"
      >
        {editing && <DealScorePanel deal={editing} />}
        <DealForm initial={editing} onCancel={close} onDone={done} />
      </CrudFormPage>
    );
  }

  // PageHeader translates the subtitle and fills in the count.
  const subtitle = data ? '{count} open and closed opportunities' : undefined;

  return (
    <Box>
      <DealsViewToggle />
      <PageHeader
        title="Deals"
        subtitle={subtitle}
        subtitleValues={{ count: deals.length }}
        actionLabel="New deal"
        onAction={() => setCreating(true)}
      />

      {loading && !data ? (
        <DealBoardSkeleton stages={PIPELINE_STAGES} />
      ) : (
        <DealBoard deals={deals} onOpen={setEditing} onMove={move} />
      )}
    </Box>
  );
}
