import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import {
  RhfChipsInput,
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AssetEdrStatus,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useListAssetAssigneesQuery,
} from '@exyconn/shell/graphql/generated';
import { ASSET_CATEGORIES, ASSET_STATUSES, isAssignedStatus } from '../../assets.constants';
import { assetSchema, toAssetInput, toAssetValues } from './asset.schema';
import type { AssetRow } from './asset.types';

const CATEGORY_OPTIONS = enumOptions(ASSET_CATEGORIES);
const STATUS_OPTIONS = enumOptions(ASSET_STATUSES);
const EDR_OPTIONS = enumOptions(Object.values(AssetEdrStatus));
type Values = z.infer<typeof assetSchema>;

interface AssetFormProps {
  initial: AssetRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to add or edit one item in the asset register. */
export function AssetForm({ initial, onDone, onCancel }: Readonly<AssetFormProps>) {
  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const { data } = useListAssetAssigneesQuery();
  const methods = useForm<z.input<typeof assetSchema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(assetSchema),
    defaultValues: toAssetValues(initial),
  });

  const status = useWatch({ control: methods.control, name: 'status' });
  const assignees: SelectOption[] = (data?.listAssetAssignees ?? []).map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));
  const nameFor = (id: string) => data?.listAssetAssignees.find((u) => u.id === id)?.name ?? '';

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Asset',
    initial,
    create: (values: Values) =>
      createAsset({ variables: { input: toAssetInput(values, nameFor) } }),
    update: (row, values) =>
      updateAsset({ variables: { id: row.id, input: toAssetInput(values, nameFor) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="assetTag" label="Asset tag" helperText="The label stuck on the item" />
      <RhfTextField
        name="name"
        label="Name"
        helperText="What the item is, e.g. MacBook Pro 14 or Dell 27 monitor."
      />
      <RhfSelect
        name="category"
        label="Category"
        options={CATEGORY_OPTIONS}
        helperText="The type of equipment, used to group the register."
      />
      <RhfSelect
        name="status"
        label="Status"
        options={STATUS_OPTIONS}
        helperText="Where the item is now. Assigned asks who has it."
      />
      {isAssignedStatus(String(status)) && (
        <RhfSelect
          name="assignedToId"
          label="Assigned to"
          options={assignees}
          helperText="The employee who currently has the item."
        />
      )}
      <RhfTextField
        name="manufacturer"
        label="Manufacturer"
        helperText="Optional. The brand, e.g. Apple or Dell."
      />
      <RhfTextField
        name="modelName"
        label="Model"
        helperText="Optional. The exact model, e.g. A2442."
      />
      <RhfTextField
        name="serialNumber"
        label="Serial number"
        helperText="Optional. The maker's serial number, used for warranty claims."
      />
      <RhfTextField
        name="location"
        label="Location"
        helperText="Optional. Where the item is kept, e.g. London office or Remote."
      />
      <RhfDatePicker
        name="purchaseDate"
        label="Purchase date"
        helperText="Optional. When the item was bought."
      />
      <RhfDatePicker
        name="warrantyExpiry"
        label="Warranty expiry"
        helperText="Optional. IT is reminded before the warranty ends."
      />
      <RhfTextField
        name="purchaseCost"
        label="Purchase cost"
        type="number"
        helperText="What was paid for the item. Enter 0 if unknown."
      />
      <RhfChipsInput
        name="installedSoftware"
        label="Installed software"
        helperText="Press Enter after each"
      />
      <RhfSelect
        name="edrStatus"
        label="Antivirus / EDR"
        options={EDR_OPTIONS}
        helperText="Whether endpoint protection is installed and up to date on this device."
      />
      <RhfDatePicker
        name="edrCheckedAt"
        label="EDR last checked"
        helperText="Optional. When the protection status was last confirmed."
      />
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        rows={2}
        helperText="Optional. Condition, accessories or repair history."
      />
    </EntityForm>
  );
}
