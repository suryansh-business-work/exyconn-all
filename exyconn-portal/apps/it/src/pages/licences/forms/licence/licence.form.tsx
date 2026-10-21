import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import {
  RhfTextField,
  RhfSelect,
  RhfMultiSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  useCreateLicenceMutation,
  useUpdateLicenceMutation,
  useListAssetAssigneesQuery,
} from '@exyconn/shell/graphql/generated';
import { LICENCE_BILLING_CYCLES, LICENCE_STATUSES } from '../../licences.constants';
import { licenceSchema, toLicenceValues } from './licence.schema';
import type { LicenceRow } from './licence.types';

const CYCLE_OPTIONS = enumOptions(LICENCE_BILLING_CYCLES);
const STATUS_OPTIONS = enumOptions(LICENCE_STATUSES);
type Values = z.infer<typeof licenceSchema>;

interface LicenceFormProps {
  initial: LicenceRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to add or edit one software licence and its seats. */
export function LicenceForm({ initial, onDone, onCancel }: Readonly<LicenceFormProps>) {
  const t = useT();
  const [createLicence] = useCreateLicenceMutation();
  const [updateLicence] = useUpdateLicenceMutation();
  const { data } = useListAssetAssigneesQuery();
  const methods = useForm<z.input<typeof licenceSchema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(licenceSchema),
    defaultValues: toLicenceValues(initial),
  });

  const assignees: SelectOption[] = (data?.listAssetAssignees ?? []).map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));
  const seatsTotal = useWatch({ control: methods.control, name: 'seatsTotal' });
  const held = useWatch({ control: methods.control, name: 'assigneeIds' }).length;
  const total = Number(seatsTotal) || 0;
  const seatsHelper =
    held === 1
      ? t('{held} of {total} seat in use', { held, total })
      : t('{held} of {total} seats in use', { held, total });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Licence',
    initial,
    create: (values: Values) => createLicence({ variables: { input: values } }),
    update: (row, values) => updateLicence({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Licence" helperText="e.g. Figma Organization" />
      <RhfTextField
        name="vendor"
        label="Vendor"
        helperText="The company that sells the licence, e.g. Figma."
      />
      <RhfTextField
        name="seatsTotal"
        label="Seats bought"
        type="number"
        helperText="How many people the licence covers. At least one."
      />
      <RhfMultiSelect
        name="assigneeIds"
        label="Seats assigned"
        options={assignees}
        helperText={seatsHelper}
      />
      <RhfTextField
        name="cost"
        label="Cost per cycle"
        type="number"
        helperText="What each billing cycle costs for all seats. Enter 0 if it is free."
      />
      <RhfSelect
        name="billingCycle"
        label="Billing cycle"
        options={CYCLE_OPTIONS}
        helperText="How often the licence is billed."
      />
      <RhfDatePicker
        name="renewalDate"
        label="Renews on"
        helperText="The next renewal date; IT is reminded before it arrives."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Whether the licence is active or has been cancelled."
      />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        rows={2}
        helperText="Optional. Contract details or who to contact at the vendor."
      />
    </EntityForm>
  );
}
