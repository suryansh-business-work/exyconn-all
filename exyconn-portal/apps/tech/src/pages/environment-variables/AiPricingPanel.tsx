import { Box, Divider, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { BoolChip } from '@exyconn/shell/components/data/BoolChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrudResource } from '@exyconn/crud';
import {
  useAiSpendLimitQuery,
  useDeleteAiModelPriceMutation,
  useListAiModelPricesQuery,
} from '@exyconn/shell/graphql/generated';
import { AiModelPriceForm, type AiModelPriceRow } from './forms/ai-model-price';
import { AiSpendLimitForm } from './forms/ai-spend-limit';

/** Prices are small numbers; six decimals is where the cheapest models stop rounding to 0. */
const PRICE_DIGITS = 6;

const usdPer1k = (value: number) => `$${value.toFixed(PRICE_DIGITS)}`;

/**
 * AI Pricing: what each model costs, and the budget every run is checked against.
 *
 * It sits under Environment Variables because it is the same kind of thing — platform
 * configuration held in the database so it can be corrected without a release. OpenAI
 * changes its list prices on its own schedule, and a wrong price here silently misreports
 * every AI cost in the portal.
 */
export function AiPricingPanel() {
  const { data, loading, refetch } = useListAiModelPricesQuery();
  const limit = useAiSpendLimitQuery();
  const [deletePrice] = useDeleteAiModelPriceMutation();
  const crud = useCrudResource<AiModelPriceRow>({
    label: 'AI model price',
    onDelete: (row) => deletePrice({ variables: { id: row.id } }),
    confirmMessage: (row) => `Delete the price for "${row.model}"?`,
    refetch,
  });

  const columns: Column<AiModelPriceRow>[] = [
    { key: 'model', label: 'Model' },
    { key: 'inputPer1kUsd', label: 'Input / 1K', render: (r) => usdPer1k(r.inputPer1kUsd) },
    { key: 'outputPer1kUsd', label: 'Output / 1K', render: (r) => usdPer1k(r.outputPer1kUsd) },
    { key: 'active', label: 'In use', render: (r) => <BoolChip value={r.active} /> },
  ];

  const budget = limit.data?.aiSpendLimit;

  return (
    <Box>
      <PageHeader
        title="AI pricing"
        subtitle="What each model costs, in US dollars per 1,000 tokens"
        actionLabel="New model price"
        onAction={crud.openCreate}
      />
      <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
        Seeded with OpenAI&rsquo;s published prices on first boot and never overwritten again, so a
        correction made here survives every restart. A model with no active price costs a run
        nothing rather than an invented amount.
      </Text>
      <DataTable
        columns={columns}
        rows={data?.listAiModelPrices ?? []}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage={loading ? 'Loading…' : 'No model prices yet.'}
      />

      <Divider sx={{ my: 3 }} />
      <PageHeader title="AI budget" subtitle="The ceiling every run is checked against" />
      {budget ? (
        <AiSpendLimitForm
          initial={budget}
          onCancel={() => limit.refetch()}
          onDone={() => limit.refetch()}
        />
      ) : (
        <Text size="sm">Loading the budget…</Text>
      )}

      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit model price' : 'New model price'}
        onClose={crud.close}
      >
        <AiModelPriceForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
