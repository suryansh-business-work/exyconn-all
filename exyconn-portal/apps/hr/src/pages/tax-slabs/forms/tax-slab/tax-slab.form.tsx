import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateTaxSlabMutation,
  useUpdateTaxSlabMutation,
} from '@exyconn/shell/graphql/generated';
import type { TaxSlabRow } from './tax-slab.types';

/** An empty upper bound is the open-ended top band, not a missing answer. */
const OPEN_ENDED = '';

const schema = z
  .object({
    regimeKey: z.string().trim().min(1, 'Choose the regime this band belongs to'),
    financialYear: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}$/, 'Write the financial year as 2026-27'),
    fromAmount: z.coerce.number().min(0, 'The lower bound cannot be negative'),
    toAmount: z.union([
      z.literal(OPEN_ENDED),
      z.coerce.number().min(0, 'The upper bound cannot be negative'),
    ]),
    ratePercent: z.coerce
      .number()
      .min(0, 'A rate cannot be negative')
      .max(100, 'A rate cannot exceed 100%'),
    order: z.coerce.number().int('Use a whole number').min(0, 'The order cannot be negative'),
    active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.toAmount !== OPEN_ENDED && values.toAmount <= values.fromAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toAmount'],
        message: 'The upper bound has to be above the lower one',
      });
    }
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: TaxSlabRow | null, regimeKey: string, financialYear: string) => ({
  regimeKey: row?.regimeKey ?? regimeKey,
  financialYear: row?.financialYear ?? financialYear,
  fromAmount: row?.fromAmount ?? 0,
  toAmount: row?.toAmount ?? OPEN_ENDED,
  ratePercent: row?.ratePercent ?? 0,
  order: row?.order ?? 0,
  active: row?.active ?? true,
});

/** The stored band: an empty upper bound becomes null, which is what "no ceiling" means. */
const toInput = (values: Values) => ({
  ...values,
  toAmount: values.toAmount === OPEN_ENDED ? null : values.toAmount,
});

interface TaxSlabFormProps {
  initial: TaxSlabRow | null;
  /** The regimes on file, so a band cannot be filed against one that does not exist. */
  regimeOptions: SelectOption[];
  /** What a new band is filed under, taken from the regime the page is showing. */
  defaultRegimeKey: string;
  defaultFinancialYear: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * One band of a regime's income-tax table.
 *
 * Both bounds are entered rather than derived from the neighbouring rows, so reordering the
 * table never silently re-cuts the bands around it. The top band is left with no upper bound.
 */
export function TaxSlabForm({
  initial,
  regimeOptions,
  defaultRegimeKey,
  defaultFinancialYear,
  onDone,
  onCancel,
}: Readonly<TaxSlabFormProps>) {
  const [createSlab] = useCreateTaxSlabMutation();
  const [updateSlab] = useUpdateTaxSlabMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, defaultRegimeKey, defaultFinancialYear),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Tax slab',
    initial,
    create: (values: Values) => createSlab({ variables: { input: toInput(values) } }),
    update: (row, values) => updateSlab({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <Text size="sm" color="text.secondary">
        Each band’s rate applies only to the part of the year’s income inside it. Bands take effect
        on the next payroll run.
      </Text>
      <RhfSelect name="regimeKey" label="Regime" options={regimeOptions} />
      <RhfTextField name="financialYear" label="Financial year" helperText="As 2026-27." />
      <RhfTextField
        name="order"
        label="Position"
        type="number"
        helperText="Bands are walked lowest first. 0 is the bottom band."
      />
      <RhfTextField
        name="fromAmount"
        label="From"
        type="number"
        helperText="Income above this falls in this band."
      />
      <RhfTextField
        name="toAmount"
        label="To"
        type="number"
        helperText="Leave empty for the top band, which has no upper bound."
      />
      <RhfTextField name="ratePercent" label="Rate (%)" type="number" />
      <RhfSwitch name="active" label="Apply this band" />
    </EntityForm>
  );
}
