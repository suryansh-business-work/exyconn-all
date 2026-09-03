import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  AssetStatus,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useListAssetAssigneesQuery,
} from '@exyconn/shell/graphql/generated';
import { ASSET_CATEGORIES, ASSET_STATUSES, isAssignedStatus } from '../../assets.constants';
import { assetSchema, toAssetInput, toAssetValues } from './asset.schema';
import type { AssetRow } from './asset.types';

const CATEGORY_OPTIONS = enumOptions(ASSET_CATEGORIES);
const STATUS_OPTIONS = enumOptions(ASSET_STATUSES);
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
      <RhfTextField name="name" label="Name" />
      <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
      <RhfSelect name="status" label="Status" options={STATUS_OPTIONS} />
      {isAssignedStatus(String(status ?? AssetStatus.InStock)) && (
        <RhfSelect name="assignedToId" label="Assigned to" options={assignees} />
      )}
      <RhfTextField name="manufacturer" label="Manufacturer" />
      <RhfTextField name="modelName" label="Model" />
      <RhfTextField name="serialNumber" label="Serial number" />
      <RhfTextField name="location" label="Location" />
      <RhfDatePicker name="purchaseDate" label="Purchase date" />
      <RhfDatePicker name="warrantyExpiry" label="Warranty expiry" />
      <RhfTextField name="purchaseCost" label="Purchase cost" type="number" />
      <RhfTextField name="notes" label="Notes" multiline rows={2} />
    </EntityForm>
  );
}
