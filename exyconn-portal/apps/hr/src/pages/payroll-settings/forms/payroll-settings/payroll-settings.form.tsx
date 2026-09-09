import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { TdsMode, useUpdatePayrollSettingsMutation } from '@exyconn/shell/graphql/generated';
import { TdsSlabFields } from './tds-slabs.fields';
import { TdsRegimeFields } from './tds-regime.fields';
import type { PayrollSettingsRow } from './payroll-settings.types';

const percent = (label: string) =>
  z.coerce.number().min(0, `${label} cannot be negative`).max(100, `${label} cannot exceed 100%`);
const amount = (label: string) => z.coerce.number().min(0, `${label} cannot be negative`);

const schema = z.object({
  pfEnabled: z.boolean(),
  pfEmployeePercent: percent('The PF rate'),
  pfWageCeiling: amount('The PF wage ceiling'),
  esiEnabled: z.boolean(),
  esiEmployeePercent: percent('The ESI rate'),
  esiWageLimit: amount('The ESI wage limit'),
  professionalTaxMonthly: amount('Professional tax'),
  tdsMode: z.nativeEnum(TdsMode),
  tdsFlatPercent: percent('The TDS rate'),
  // An empty upper limit is the open-ended top band, not a missing value.
  tdsSlabs: z.array(
    z.object({
      upTo: z.union([z.coerce.number().min(0, 'Cannot be negative'), z.null()]).nullable(),
      percent: percent('A band rate'),
    }),
  ),
  tdsAnnualExemption: amount('The annual exemption'),
  tdsCessPercent: percent('The cess'),
  tdsRegimeKey: z.string().trim().min(1, 'Choose the regime to apply'),
  financialYearStartMonth: z.coerce
    .number()
    .int('Use a whole month number')
    .min(1, 'Months run 1-12')
    .max(12, 'Months run 1-12'),
});
type Values = z.infer<typeof schema>;

const TDS_OPTIONS = [
  { value: TdsMode.None, label: 'Do not withhold income tax' },
  { value: TdsMode.FlatPercent, label: 'A flat percentage of taxable pay' },
  { value: TdsMode.Slab, label: 'Tax bands (with a per-employee rate taking precedence)' },
];

/** Only the fields the chosen mode actually withholds by are shown. */
function TdsFields() {
  const { watch } = useFormContext<Values>();
  const mode = watch('tdsMode');

  if (mode === TdsMode.FlatPercent) {
    return (
      <RhfTextField
        name="tdsFlatPercent"
        label="Company TDS rate (%)"
        type="number"
        helperText="Used for every employee whose salary structure does not set their own rate."
      />
    );
  }

  if (mode === TdsMode.Slab) {
    return (
      <>
        <TdsRegimeFields />
        <TdsSlabFields />
        <RhfTextField
          name="tdsAnnualExemption"
          label="Annual exemption"
          type="number"
          helperText="Subtracted from annual taxable pay before the bands are applied."
        />
        <RhfTextField
          name="tdsCessPercent"
          label="Cess (%)"
          type="number"
          helperText="Charged on the tax itself, not on the pay. Leave at 0 if none applies."
        />
      </>
    );
  }

  return null;
}

interface PayrollSettingsFormProps {
  initial: PayrollSettingsRow;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * The statutory deduction policy every payslip is worked out from.
 *
 * Saving applies to the NEXT payroll run: a slip that has already been generated keeps the
 * figures it was generated with, because those are the ones that were actually withheld.
 */
export function PayrollSettingsForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PayrollSettingsFormProps>) {
  const notify = useNotify();
  const [saveSettings] = useUpdatePayrollSettingsMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    values: {
      pfEnabled: initial.pfEnabled,
      pfEmployeePercent: initial.pfEmployeePercent,
      pfWageCeiling: initial.pfWageCeiling,
      esiEnabled: initial.esiEnabled,
      esiEmployeePercent: initial.esiEmployeePercent,
      esiWageLimit: initial.esiWageLimit,
      professionalTaxMonthly: initial.professionalTaxMonthly,
      tdsMode: initial.tdsMode,
      tdsFlatPercent: initial.tdsFlatPercent,
      tdsSlabs: (initial.tdsSlabs ?? []).map((slab) => ({
        upTo: slab.upTo ?? null,
        percent: slab.percent,
      })),
      tdsAnnualExemption: initial.tdsAnnualExemption ?? 0,
      tdsCessPercent: initial.tdsCessPercent ?? 0,
      tdsRegimeKey: initial.tdsRegimeKey,
      financialYearStartMonth: initial.financialYearStartMonth,
    },
  });

  const onSubmit = async (values: Values) => {
    try {
      await saveSettings({ variables: { input: values } });
      notify('Statutory deductions saved — they apply from the next payroll run');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save the policy', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save deductions"
    >
      <Text size="sm" color="text.secondary">
        These apply to every employee unless their own salary structure says otherwise. A payslip
        that has already been generated keeps the figures it was generated with.
      </Text>
      <RhfSwitch name="pfEnabled" label="Withhold provident fund (PF)" />
      <RhfTextField name="pfEmployeePercent" label="PF rate (% of basic)" type="number" />
      <RhfTextField
        name="pfWageCeiling"
        label="PF wage ceiling"
        type="number"
        helperText="PF is charged on basic only up to this figure; anything above it is exempt."
      />
      <RhfSwitch name="esiEnabled" label="Withhold employee state insurance (ESI)" />
      <RhfTextField name="esiEmployeePercent" label="ESI rate (% of gross)" type="number" />
      <RhfTextField
        name="esiWageLimit"
        label="ESI wage limit"
        type="number"
        helperText="ESI applies only while gross is at or below this figure."
      />
      <RhfTextField
        name="professionalTaxMonthly"
        label="Professional tax per month"
        type="number"
        helperText="A flat amount. Set it to 0 in a state that does not levy it."
      />
      <RhfSelect name="tdsMode" label="Income tax (TDS)" options={TDS_OPTIONS} />
      <TdsFields />
    </EntityForm>
  );
}
