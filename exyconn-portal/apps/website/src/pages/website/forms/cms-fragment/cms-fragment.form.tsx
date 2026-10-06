import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  CmsFragmentKind,
  useCreateCmsFragmentMutation,
  useUpdateCmsFragmentMutation,
} from '@exyconn/shell/graphql/generated';
import {
  FRAGMENT_KIND_OPTIONS,
  fragmentSchema,
  type CmsFragmentRow,
  type FragmentFormValues,
} from './cms-fragment.types';

interface CmsFragmentFormProps {
  siteId: string;
  initial: CmsFragmentRow | null;
  onDone: () => void;
  onCancel: () => void;
  /** A new fragment's id, so the caller can open it in the builder. */
  onCreated?: (id: string) => void;
}

/** React Hook Form + Zod form for a fragment's name and kind (its content is built visually). */
export function CmsFragmentForm({
  siteId,
  initial,
  onDone,
  onCancel,
  onCreated,
}: Readonly<CmsFragmentFormProps>) {
  const [createFragment] = useCreateCmsFragmentMutation();
  const [updateFragment] = useUpdateCmsFragmentMutation();
  const methods = useForm<FragmentFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(fragmentSchema),
    defaultValues: { name: initial?.name ?? '', kind: initial?.kind ?? CmsFragmentKind.Section },
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Fragment',
    initial,
    create: async (values: FragmentFormValues) => {
      const result = await createFragment({ variables: { siteId, input: values } });
      if (result.data) onCreated?.(result.data.createCmsFragment.id);
    },
    update: (row, values) => updateFragment({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" helperText="e.g. Main header, Newsletter sign-up" />
      <RhfSelect name="kind" label="Kind" options={FRAGMENT_KIND_OPTIONS} />
    </EntityForm>
  );
}
