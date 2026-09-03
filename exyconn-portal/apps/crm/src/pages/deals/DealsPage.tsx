import { useMemo, useState } from 'react';
import { Box, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  DealStage,
  useListDealsQuery,
  useSetDealStageMutation,
} from '@exyconn/shell/graphql/generated';
import { DealForm, type DealRow } from './forms/deal';
import { DealColumn } from './DealColumn';
import { PIPELINE_STAGES, STAGE_ACCENTS, stageLabel } from './deals.constants';

/**
 * CRM → Deals: the pipeline as a board, where moving a deal is one drag. There is
 * no delete here on purpose — a deal that goes nowhere is moved to Lost, which is
 * information, rather than removed, which is not.
 */
export function DealsPage() {
  const notify = useNotify();
  const { data, loading, refetch } = useListDealsQuery({ fetchPolicy: 'cache-and-network' });
  const [setStage] = useSetDealStageMutation();
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [creating, setCreating] = useState(false);

  const deals = useMemo(() => data?.listDeals ?? [], [data]);
  const byStage = useMemo(() => {
    const map = new Map<DealStage, DealRow[]>(PIPELINE_STAGES.map((stage) => [stage, []]));
    for (const deal of deals) {
      map.get(deal.stage)?.push(deal);
    }
    return map;
  }, [deals]);

  const move = async (dealId: string, stage: DealStage) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === stage) {
      return;
    }
    try {
      await setStage({ variables: { id: dealId, stage } });
      notify(`"${deal.title}" moved to ${stageLabel(stage)}`);
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

  return (
    <Box>
      <PageHeader
        title="Deals"
        subtitle={loading ? 'Loading pipeline…' : `${deals.length} open and closed opportunities`}
        actionLabel="New deal"
        onAction={() => setCreating(true)}
      />

      <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
        {PIPELINE_STAGES.map((stage) => (
          <DealColumn
            key={stage}
            stage={stage}
            accent={STAGE_ACCENTS[stage]}
            deals={byStage.get(stage) ?? []}
            onOpen={setEditing}
            onDropDeal={move}
          />
        ))}
      </Stack>

      <CrudDialog
        open={creating || Boolean(editing)}
        title={editing ? 'Edit deal' : 'New deal'}
        onClose={close}
      >
        <DealForm initial={editing} onCancel={close} onDone={done} />
      </CrudDialog>
    </Box>
  );
}
