import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUpdateAssetMutation } from '@exyconn/shell/graphql/generated';
import type { AssetNotesRow } from './asset-notes.types';

const MAX_NOTES = 2000;

const schema = z.object({
  notes: z.string().trim().max(MAX_NOTES, `Keep notes under ${MAX_NOTES} characters`),
});

type Values = z.infer<typeof schema>;

/**
 * The rest of the asset, resent unchanged.
 *
 * `updateAsset` takes the whole record, so saving a note means sending everything else back
 * exactly as it came. Reading it off the loaded row rather than off a second form is what
 * keeps a note from quietly clearing a serial number.
 */
const unchanged = (asset: AssetNotesRow) => ({
  assetTag: asset.assetTag,
  name: asset.name,
  category: asset.category,
  status: asset.status,
  manufacturer: asset.manufacturer,
  modelName: asset.modelName,
  serialNumber: asset.serialNumber,
  assignedToId: asset.assignedToId,
  assignedToName: asset.assignedToName,
  location: asset.location,
  purchaseDate: asset.purchaseDate,
  warrantyExpiry: asset.warrantyExpiry,
  purchaseCost: asset.purchaseCost,
});

interface AssetNotesFormProps {
  asset: AssetNotesRow;
  onDone: () => void;
}

/** React Hook Form + Zod form for the running notes kept against one asset. */
export function AssetNotesForm({ asset, onDone }: Readonly<AssetNotesFormProps>) {
  const notify = useNotify();
  const [updateAsset] = useUpdateAssetMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { notes: asset.notes },
  });

  const onSubmit = async (values: Values) => {
    try {
      await updateAsset({
        variables: { id: asset.id, input: { ...unchanged(asset), notes: values.notes } },
      });
      notify('Notes saved');
      onDone();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the notes'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={() => methods.reset({ notes: asset.notes })}
      submitLabel="Save notes"
    >
      <RhfTextField
        name="notes"
        label="Notes"
        multiline
        minRows={3}
        helperText="Repairs, quirks, anything the next holder should know"
      />
    </EntityForm>
  );
}
