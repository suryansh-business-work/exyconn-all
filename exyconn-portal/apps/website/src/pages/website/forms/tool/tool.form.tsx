import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfSelect,
  RhfChipsInput,
  RhfSwitch,
} from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateToolMutation,
  useUpdateToolMutation,
  useListToolCategoriesQuery,
} from '@exyconn/shell/graphql/generated';
import type { ToolRow } from './tool.types';

const schema = z.object({
  toolCode: z.string().trim().min(1, 'Tool code is required'),
  categorySlug: z.string().min(1, 'Category is required'),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string(),
  longDescription: z.string(),
  url: z.string(),
  icon: z.string(),
  color: z.string(),
  features: z.array(z.string()),
  useCases: z.array(z.string()),
  keywords: z.array(z.string()),
  isActive: z.boolean(),
  isMVP: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Must be ≥ 0'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ToolRow | null): Values => ({
  toolCode: row?.toolCode ?? '',
  categorySlug: row?.categorySlug ?? '',
  name: row?.name ?? '',
  description: row?.description ?? '',
  longDescription: row?.longDescription ?? '',
  url: row?.url ?? '',
  icon: row?.icon ?? '',
  color: row?.color ?? '',
  features: row?.features ?? [],
  useCases: row?.useCases ?? [],
  keywords: row?.keywords ?? [],
  isActive: row?.isActive ?? true,
  isMVP: row?.isMVP ?? false,
  order: row?.order ?? 0,
});

interface ToolFormProps {
  initial: ToolRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to create or update a tool. `pricing` and `seo` are not
 * edited here — the server's partial `$set` update keeps whatever is already stored.
 */
export function ToolForm({ initial, onDone, onCancel }: Readonly<ToolFormProps>) {
  const notify = useNotify();
  const [createTool] = useCreateToolMutation();
  const [updateTool] = useUpdateToolMutation();
  const { data: categoryData } = useListToolCategoriesQuery();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const categoryOptions = (categoryData?.listToolCategories ?? []).map((category) => ({
    label: category.category,
    value: category.slug,
  }));

  const onSubmit = async (input: Values) => {
    try {
      if (isEdit && initial) await updateTool({ variables: { id: initial.id, input } });
      else await createTool({ variables: { input } });
      notify(`Tool ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="toolCode" label="Tool code" helperText="Unique code, e.g. TL-001" />
          <RhfSelect
            name="categorySlug"
            label="Category"
            options={categoryOptions}
            helperText="Managed under Website → Tool categories"
          />
          <RhfTextField name="name" label="Name" />
          <RhfTextField name="description" label="Description" multiline minRows={2} />
          <RhfTextField
            name="longDescription"
            label="Long description"
            multiline
            minRows={6}
            helperText="HTML is allowed — the body is rendered as-is on the public site."
          />
          <RhfTextField name="url" label="URL" helperText="Where the tool lives, e.g. /tools/foo" />
          <RhfTextField name="icon" label="Icon" helperText="Icon name rendered on the site" />
          <RhfTextField name="color" label="Color" helperText="Hex color, e.g. #f9851f" />
          <RhfChipsInput name="features" label="Features" />
          <RhfChipsInput name="useCases" label="Use cases" />
          <RhfChipsInput name="keywords" label="Keywords" />
          <RhfSwitch name="isActive" label="Active" />
          <RhfSwitch name="isMVP" label="MVP" />
          <RhfTextField
            name="order"
            label="Order"
            type="number"
            helperText="Lower numbers appear first"
          />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
