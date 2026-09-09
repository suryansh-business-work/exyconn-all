import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateTaxRegimeMutation,
  useUpdateTaxRegimeMutation,
} from '@exyconn/shell/graphql/generated';
import type { TaxRegimeRow } from './tax-regime.types';

/** `2026-27` — the year a regime's figures belong to, as every band also records it. */
const FINANCIAL_YEAR = /^\d{4}-\d{2}$/;

const amount = (label: string) => z.coerce.number().min(0, `${label} cannot be negative`);

const schema = z.object({
  regimeKey: z
    .string()
    .trim()
    .min(1, 'A key is required')
    .regex(/^[A-Z0-9_]+$/, 'Use capitals, digits and underscores, e.g. NEW or OLD'),
  financialYear: z.string().trim().regex(FINANCIAL_YEAR, 'Write the financial year as 2026-27'),
  name: z.string().trim().min(1, 'A name is required'),
  standardDeduction: amount('The standard deduction'),
  rebateIncomeLimit: amount('The rebate threshold'),
  rebateMaxTax: amount('The rebate'),
  cessPercent: z.coerce
    .number()
    .min(0, 'Cess cannot be negative')
    .max(100, 'Cess cannot exceed 100%'),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: TaxRegimeRow | null) => ({
  regimeKey: row?.regimeKey ?? '',
  financialYear: row?.financialYear ?? '',
  name: row?.name ?? '',
  standardDeduction: row?.standardDeduction ?? 0,
  rebateIncomeLimit: row?.rebateIncomeLimit ?? 0,
  rebateMaxTax: row?.rebateMaxTax ?? 0,
  cessPercent: row?.cessPercent ?? 0,
  active: row?.active ?? true,
});

interface TaxRegimeFormProps {
  initial: TaxRegimeRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * One regime's figures: the standard deduction taken off pay before its bands are walked,
 * and the rebate that writes a small bill down to nothing afterwards.
 *
 * Both regimes stand side by side, each with its own numbers, and Payroll Settings names
 * which key the next run applies. Nothing here is a rate this portal invented — the seeded
 * figures are a starting point to be checked against the year's finance act.
 */
export function TaxRegimeForm({ initial, onDone, onCancel }: Readonly<TaxRegimeFormProps>) {
  const [createRegime] = useCreateTaxRegimeMutation();
  const [updateRegime] = useUpdateTaxRegimeMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Tax regime',
    initial,
    create: (values: Values) => createRegime({ variables: { input: values } }),
    update: (row, values) => updateRegime({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <Text size="sm" color="text.secondary">
        Check every figure against this year’s finance act. They apply from the next payroll run; a
        payslip already generated keeps what was withheld on it.
      </Text>
      <RhfTextField
        name="regimeKey"
        label="Key"
        helperText="Short and stable, e.g. NEW or OLD. The bands point at this."
      />
      <RhfTextField name="financialYear" label="Financial year" helperText="As 2026-27." />
      <RhfTextField name="name" label="Name" helperText="What HR reads in the list." />
      <RhfTextField
        name="standardDeduction"
        label="Standard deduction"
        type="number"
        helperText="Taken off annual pay before the bands are walked."
      />
      <RhfTextField
        name="rebateIncomeLimit"
        label="Rebate threshold"
        type="number"
        helperText="Taxable income at or below this has its bill written off."
      />
      <RhfTextField
        name="rebateMaxTax"
        label="Maximum rebate"
        type="number"
        helperText="The most tax the rebate can write off. Applied before cess."
      />
      <RhfTextField
        name="cessPercent"
        label="Cess (%)"
        type="number"
        helperText="Charged on the tax, never on the income."
      />
      <RhfSwitch name="active" label="Apply this regime" />
    </EntityForm>
  );
}
