import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  SupportCategory,
  SupportPriority,
  useCreateSupportTicketMutation,
} from '@/graphql/generated';

const schema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').min(3, 'Add a short subject'),
  category: z.nativeEnum(SupportCategory),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(10, 'Describe the issue in a bit more detail'),
  priority: z.nativeEnum(SupportPriority),
});
type Values = z.infer<typeof schema>;

const INITIAL: Values = {
  subject: '',
  category: SupportCategory.It,
  description: '',
  priority: SupportPriority.Medium,
};

/** React Hook Form + Zod form for an employee to raise a support ticket (status set to OPEN). */
export function SupportTicketForm({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: () => void;
}) {
  const notify = useNotify();
  const [createTicket] = useCreateSupportTicketMutation();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const onSubmit = async (values: Values) => {
    try {
      await createTicket({ variables: { input: values } });
      notify('Support ticket raised');
      methods.reset();
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not raise support ticket', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="subject" label="Subject" />
          <RhfSelect
            name="category"
            label="Category"
            options={enumOptions(Object.values(SupportCategory))}
          />
          <RhfSelect
            name="priority"
            label="Priority"
            options={enumOptions(Object.values(SupportPriority))}
          />
          <RhfTextField name="description" label="Description" multiline minRows={3} />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={false}
            onCancel={onCancel}
            submitLabel="Raise ticket"
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
