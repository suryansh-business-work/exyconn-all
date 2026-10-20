import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { TextField } from '@exyconn/shell/components/ui';
import { RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreatePreferenceCategoryMutation,
  useUpdatePreferenceCategoryMutation,
} from '@exyconn/shell/graphql/generated';
import {
  preferenceCategorySchema,
  toCategoryValues,
  type PreferenceCategoryRow,
  type PreferenceCategoryValues,
} from './preference-category.types';

interface PreferenceCategoryFormProps {
  initial: PreferenceCategoryRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** A kind of marketing email recipients can turn off on the public preference page. */
export function PreferenceCategoryForm({
  initial,
  onDone,
  onCancel,
}: Readonly<PreferenceCategoryFormProps>) {
  const t = useT();
  const [create] = useCreatePreferenceCategoryMutation();
  const [update] = useUpdatePreferenceCategoryMutation();
  const methods = useForm<PreferenceCategoryValues>({
    mode: 'onTouched',
    resolver: zodResolver(preferenceCategorySchema),
    defaultValues: toCategoryValues(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Category',
    initial,
    create: (values: PreferenceCategoryValues) => create({ variables: { input: values } }),
    update: (row, values) => update({ variables: { id: row.id, input: values } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="name"
        label="Category name"
        required
        helperText="What recipients see, e.g. “Product updates”."
      />
      <RhfTextField
        name="description"
        label="Description"
        multiline
        rows={2}
        helperText="One line on what these emails are about."
      />
      <Controller
        name="sortOrder"
        control={methods.control}
        render={({ field, fieldState }) => (
          <TextField
            type="number"
            label={t('Order on the page')}
            value={field.value}
            onChange={(event) => field.onChange(Number(event.target.value))}
            onBlur={field.onBlur}
            error={Boolean(fieldState.error)}
            helperText={t(fieldState.error?.message ?? 'Lower numbers are listed first.')}
          />
        )}
      />
      <RhfSwitch name="isActive" label="Offer this category on the preference page" />
    </EntityForm>
  );
}
