import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  ProjectStatus,
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '@exyconn/shell/graphql/generated';
import type { ProjectRow } from './project.types';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().max(500, 'Keep the description under 500 characters'),
    status: z.nativeEnum(ProjectStatus),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || new Date(v.endDate) >= new Date(v.startDate), {
    path: ['endDate'],
    message: 'End date must be on or after the start date',
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: ProjectRow | null): Values => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  status: row?.status ?? ProjectStatus.Planning,
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
});

interface ProjectFormProps {
  initial: ProjectRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a project. */
export function ProjectForm({ initial, onDone, onCancel }: ProjectFormProps) {
  const notify = useNotify();
  const [createProject] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const isEdit = Boolean(initial);

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = {
      name: values.name,
      description: values.description,
      status: values.status,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };
    try {
      if (isEdit && initial) {
        await updateProject({ variables: { id: initial.id, input } });
      } else {
        await createProject({ variables: { input } });
      }
      notify(`Project ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Project name" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(ProjectStatus))}
          />
          <RhfDatePicker name="startDate" label="Start date" />
          <RhfDatePicker name="endDate" label="End date" />
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
