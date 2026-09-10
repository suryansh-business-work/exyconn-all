import { Box, Grid, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { glass } from '@exyconn/shell/components/glass/glass';
import type { AiSpendSummaryQuery } from '@exyconn/shell/graphql/generated';

type Summary = AiSpendSummaryQuery['aiSpendSummary'];
/** `DataTable` keys its rows on `id`; the summary groups on a user id and a model name. */
type UserSpend = Summary['byUser'][number] & { id: string };
type ModelSpend = Summary['byModel'][number] & { id: string };

/** Dollars, at the precision an AI bill is actually argued about. */
const USD_DIGITS = 4;
const usd = (value: number) => `$${value.toFixed(USD_DIGITS)}`;

const USER_COLUMNS: Column<UserSpend>[] = [
  { key: 'name', label: 'Person' },
  { key: 'jobs', label: 'Runs', render: (row) => row.jobs.toLocaleString() },
  { key: 'usd', label: 'Spent', render: (row) => usd(row.usd) },
];

const MODEL_COLUMNS: Column<ModelSpend>[] = [
  { key: 'model', label: 'Model' },
  { key: 'jobs', label: 'Runs', render: (row) => row.jobs.toLocaleString() },
  { key: 'usd', label: 'Spent', render: (row) => usd(row.usd) },
];

interface AiSpendPanelProps {
  summary?: Summary;
  loading: boolean;
  /** How the window is described above the tables, e.g. "this month". */
  periodLabel: string;
}

/**
 * Where the AI money went over a window, by person and by model.
 *
 * Both cuts matter and answer different questions: by model is what to change to spend
 * less, by person is who to talk to. Runs on models with no price on file contribute
 * nothing, so a total that looks low usually means a missing price rather than a quiet month.
 */
export function AiSpendPanel({ summary, loading, periodLabel }: Readonly<AiSpendPanelProps>) {
  const empty = loading ? 'Loading…' : 'Nothing spent in this period.';
  const userRows: UserSpend[] = (summary?.byUser ?? []).map((row) => ({
    ...row,
    id: row.userId || 'unattributed',
  }));
  const modelRows: ModelSpend[] = (summary?.byModel ?? []).map((row) => ({
    ...row,
    id: row.model || 'unknown',
  }));

  return (
    <Box sx={[glass, { p: 2, mb: 1.5 }]}>
      <Text size="label">Spend {periodLabel}</Text>
      <Text size="sm" color="text.secondary" sx={{ mb: 1.5 }}>
        {usd(summary?.totalUsd ?? 0)} across {(summary?.byModel ?? []).length} model(s). Prices come
        from Tech &rsaquo; Environment Variables &rsaquo; AI Pricing.
      </Text>
      <Grid container spacing={1.5}>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <DataTable columns={USER_COLUMNS} rows={userRows} emptyMessage={empty} />
        </Grid>
        <Grid
          size={{
            xs: 12,
            md: 6
          }}>
          <DataTable columns={MODEL_COLUMNS} rows={modelRows} emptyMessage={empty} />
        </Grid>
      </Grid>
    </Box>
  );
}
