import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSwitch } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useCreateToolCategoryMutation, useUpdateToolCategoryMutation } from '@/graphql/generated';
import type { ToolCategoryRow } from './tool-category.types';

const schema = z.object({
  slug: z.string().trim().min(1, 'Slug is required'),
  category: z.string().trim().min(1, 'Category is required'),
  description: z.string(),
  icon: z.string(),
  color: z.string(),
  isActive: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Must be ≥ 0'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ToolCategoryRow | null): Values => ({
  slug: row?.slug ?? '',
  category: row?.category ?? '',
  description: row?.description ?? '',
  icon: row?.icon ?? '',
  color: row?.color ?? '',
  isActive: row?.isActive ?? true,
  order: row?.order ?? 0,
});

interface ToolCategoryFormProps {
  initial: ToolCategoryRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a tool category. */
export function ToolCategoryForm({ initial, onDone, onCancel }: Readonly<ToolCategoryFormProps>) {
  const notify = useNotify();
  const [createToolCategory] = useCreateToolCategoryMutation();
  const [updateToolCategory] = useUpdateToolCategoryMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (input: Values) => {
    try {
      if (isEdit && initial) {
        await updateToolCategory({ variables: { id: initial.id, input } });
      } else {
        await createToolCategory({ variables: { input } });
      }
      notify(`Tool category ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="slug" label="Slug" helperText="URL segment, e.g. ai-writing" />
          <RhfTextField name="category" label="Category" />
          <RhfTextField name="description" label="Description" multiline minRows={3} />
          <RhfTextField name="icon" label="Icon" helperText="Icon name rendered on the site" />
          <RhfTextField name="color" label="Color" helperText="Hex color, e.g. #f9851f" />
          <RhfSwitch name="isActive" label="Active" />
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
