import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useListDepartmentsQuery,
} from '@exyconn/shell/graphql/generated';
import type { PositionRow } from './position.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  department: z.string().min(1, 'Department is required'),
  description: z.string().trim().max(200, 'Keep the description under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: PositionRow | null): Values => ({
  name: row?.name ?? '',
  department: row?.department ?? '',
  description: row?.description ?? '',
});

interface PositionFormProps {
  initial: PositionRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a position (with department). */
export function PositionForm({ initial, onDone, onCancel }: PositionFormProps) {
  const notify = useNotify();
  const [createPosition] = useCreatePositionMutation();
  const [updatePosition] = useUpdatePositionMutation();
  const { data } = useListDepartmentsQuery();
  const isEdit = Boolean(initial);

  const departmentOptions = (data?.listDepartments ?? []).map((d) => ({
    value: d.name,
    label: d.name,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) {
        await updatePosition({ variables: { id: initial.id, input: values } });
      } else {
        await createPosition({ variables: { input: values } });
      }
      notify(`Position ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Position name" />
          <RhfSelect
            name="department"
            label="Department"
            options={departmentOptions}
            helperText={
              departmentOptions.length ? undefined : 'Add departments in HR → Departments first.'
            }
          />
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
