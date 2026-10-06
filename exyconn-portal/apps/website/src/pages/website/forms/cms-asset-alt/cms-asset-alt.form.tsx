import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Dialog, DialogContent, DialogTitle } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useUpdateCmsAssetAltMutation } from '@exyconn/shell/graphql/generated';
import type { AssetAltRow } from './cms-asset-alt.types';

const schema = z.object({
  alt: z.string().trim().max(300, 'Keep the alt text under 300 characters'),
});
type Values = z.infer<typeof schema>;

interface AssetAltFormProps {
  /** The file being described; null keeps the dialog closed. */
  asset: AssetAltRow | null;
  onClose: () => void;
}

/** Edits the text screen readers announce for an image (its alt attribute). */
export function AssetAltForm({ asset, onClose }: Readonly<AssetAltFormProps>) {
  const t = useT();
  const [updateAlt] = useUpdateCmsAssetAltMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { alt: asset?.alt ?? '' },
  });
  const { reset } = methods;
  useEffect(() => reset({ alt: asset?.alt ?? '' }), [asset, reset]);

  const { onSubmit } = useEntitySave<Values, AssetAltRow>({
    label: 'Alt text',
    initial: asset,
    create: () => Promise.resolve(),
    update: (row, values) => updateAlt({ variables: { id: row.id, alt: values.alt } }),
    onDone: onClose,
  });

  return (
    <Dialog
      open={asset !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="alt-title"
    >
      <DialogTitle id="alt-title">
        {t('Alt text for {name}', { name: asset?.name ?? '' })}
      </DialogTitle>
      <DialogContent>
        <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={onClose}>
          <RhfTextField
            name="alt"
            label="Alt text"
            multiline
            minRows={2}
            helperText="Describe what the image shows, for people who cannot see it. Leave empty for a decorative image."
          />
        </EntityForm>
      </DialogContent>
    </Dialog>
  );
}
