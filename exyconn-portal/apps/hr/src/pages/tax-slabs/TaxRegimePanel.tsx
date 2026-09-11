import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useCrudResource } from '@exyconn/crud';
import { useDeleteTaxRegimeMutation } from '@exyconn/shell/graphql/generated';
import { TaxRegimeForm, type TaxRegimeRow } from './forms/tax-regime';

const REGIME_COLUMNS: Column<TaxRegimeRow>[] = [
  { key: 'name', label: 'Regime' },
  { key: 'regimeKey', label: 'Key' },
  { key: 'financialYear', label: 'Financial year' },
  {
    key: 'standardDeduction',
    label: 'Standard deduction',
    render: (row) => row.standardDeduction.toLocaleString(),
  },
  {
    key: 'rebateIncomeLimit',
    label: 'Rebate up to',
    render: (row) => row.rebateIncomeLimit.toLocaleString(),
  },
  { key: 'rebateMaxTax', label: 'Max rebate', render: (row) => row.rebateMaxTax.toLocaleString() },
  { key: 'cessPercent', label: 'Cess', render: (row) => `${row.cessPercent}%` },
  { key: 'active', label: 'Applied', render: (row) => (row.active ? 'Yes' : 'No') },
];

interface TaxRegimePanelProps {
  regimes: readonly TaxRegimeRow[];
  loading: boolean;
  /** Re-reads the regimes after one is created, edited or deleted. */
  refetch: () => Promise<unknown>;
}

/**
 * The regimes the bands belong to, above the bands themselves.
 *
 * They live on this screen rather than in Payroll Settings because a regime is only
 * meaningful next to its own table: the standard deduction and the rebate are read in the
 * same breath as the bands, and editing one without seeing the other is how a payslip goes
 * wrong quietly.
 */
export function TaxRegimePanel({ regimes, loading, refetch }: Readonly<TaxRegimePanelProps>) {
  const [deleteRegime] = useDeleteTaxRegimeMutation();
  const crud = useCrudResource<TaxRegimeRow>({
    label: 'Tax regime',
    onDelete: (row) => deleteRegime({ variables: { id: row.id } }),
    confirmMessage: (row) =>
      `Delete "${row.name}" for ${row.financialYear}? Its bands stay on file and stop being applied.`,
    refetch,
  });

  return (
    <Box sx={[glass, { p: { xs: 1.5, md: 2 }, mb: 1.5 }]}>
      <Flex direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Text weight="medium">Regimes</Text>
        <Button size="small" onClick={crud.openCreate}>
          New regime
        </Button>
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        The standard deduction and the rebate that go with each table. Payroll Settings names which
        regime the next run applies.
      </Text>
      <DataTable
        columns={REGIME_COLUMNS}
        rows={[...regimes]}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No regimes yet — add one before entering bands."
        loading={loading}
        onRefresh={refetch}
      />
      <CrudDialog
        open={crud.open}
        title={crud.editing ? 'Edit tax regime' : 'New tax regime'}
        onClose={crud.close}
      >
        <TaxRegimeForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudDialog>
    </Box>
  );
}
