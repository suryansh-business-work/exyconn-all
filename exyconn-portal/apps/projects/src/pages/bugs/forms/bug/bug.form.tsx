import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  BugSeverity,
  BugStatus,
  useCreateBugMutation,
  useUpdateBugMutation,
} from '@exyconn/shell/graphql/generated';
import type { BugRow } from './bug.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(5, 'Add a little more detail'),
  severity: z.nativeEnum(BugSeverity),
  status: z.nativeEnum(BugStatus),
  assignee: z.string().trim().min(1, 'Assignee is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: BugRow | null): Values => ({
  title: row?.title ?? '',
  description: row?.description ?? '',
  severity: row?.severity ?? BugSeverity.Medium,
  status: row?.status ?? BugStatus.Open,
  assignee: row?.assignee ?? '',
  dueDate: row?.dueDate ?? '',
});

interface BugFormProps {
  initial: BugRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a bug. */
export function BugForm({ initial, onDone, onCancel }: BugFormProps) {
  const notify = useNotify();
  const [createBug] = useCreateBugMutation();
  const [updateBug] = useUpdateBugMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateBug({ variables: { id: initial.id, input: values } });
      else await createBug({ variables: { input: values } });
      notify(`Bug ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="title" label="Title" />
          <RhfTextField name="description" label="Description" multiline minRows={3} />
          <RhfSelect
            name="severity"
            label="Severity"
            options={enumOptions(Object.values(BugSeverity))}
          />
          <RhfSelect name="status" label="Status" options={enumOptions(Object.values(BugStatus))} />
          <RhfTextField name="assignee" label="Assignee" />
          <RhfDatePicker name="dueDate" label="Due date" />
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
