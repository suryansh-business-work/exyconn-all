import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { licenceSchema, toLicenceInput, toLicenceValues } from './licence.schema';
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
  const [createLicence] = useCreateLicenceMutation();
  const [updateLicence] = useUpdateLicenceMutation();
  const { data } = useListAssetAssigneesQuery();
  const methods = useForm<z.input<typeof licenceSchema>, unknown, Values>({
    resolver: zodResolver(licenceSchema),
    defaultValues: toLicenceValues(initial),
  });

  const assignees: SelectOption[] = (data?.listAssetAssignees ?? []).map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));
  const seatsTotal = useWatch({ control: methods.control, name: 'seatsTotal' });
  const held = useWatch({ control: methods.control, name: 'assigneeIds' })?.length ?? 0;

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Licence',
    initial,
    create: (values: Values) => createLicence({ variables: { input: toLicenceInput(values) } }),
    update: (row, values) =>
      updateLicence({ variables: { id: row.id, input: toLicenceInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Licence" helperText="e.g. Figma Organization" />
      <RhfTextField name="vendor" label="Vendor" />
      <RhfTextField name="seatsTotal" label="Seats bought" type="number" />
      <RhfMultiSelect
        name="assigneeIds"
        label="Seats assigned"
        options={assignees}
        helperText={`${held} of ${seatsTotal || 0} seat(s) in use`}
      />
      <RhfTextField name="cost" label="Cost per cycle" type="number" />
      <RhfSelect name="billingCycle" label="Billing cycle" options={CYCLE_OPTIONS} />
      <RhfDatePicker name="renewalDate" label="Renews on" />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
