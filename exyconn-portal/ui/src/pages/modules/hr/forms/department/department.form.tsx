import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useCreateDepartmentMutation, useUpdateDepartmentMutation } from '@/graphql/generated';
import type { DepartmentRow } from './department.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().max(200, 'Keep the description under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: DepartmentRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
});

interface DepartmentFormProps {
  initial: DepartmentRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a department. */
export function DepartmentForm({ initial, onDone, onCancel }: DepartmentFormProps) {
  const notify = useNotify();
  const [createDepartment] = useCreateDepartmentMutation();
  const [updateDepartment] = useUpdateDepartmentMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial)
        await updateDepartment({ variables: { id: initial.id, input: values } });
      else await createDepartment({ variables: { input: values } });
      notify(`Department ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Department name" />
          <RhfTextField name="description" label="Description (optional)" multiline minRows={2} />
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
