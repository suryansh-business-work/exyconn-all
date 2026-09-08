import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useCreateProjectShareMutation } from '@exyconn/shell/graphql/generated';

/** The server refuses anything outside this window; the form says so before it is sent. */
const MAX_DAYS = 365;

const schema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Give the link a name so you can tell it apart later')
    .max(60, 'Keep the name under 60 characters'),
  expiresInDays: z
    .string()
    .refine((value) => Number.isInteger(Number(value)), 'Must be a whole number of days')
    .refine((value) => Number(value) >= 1, 'A link must last at least a day')
    .refine((value) => Number(value) <= MAX_DAYS, `A link cannot last more than ${MAX_DAYS} days`),
});

type Values = z.infer<typeof schema>;

interface ShareFormProps {
  projectId: string;
  /** Handed the one-time URL. It is not recoverable after this call. */
  onCreated: (url: string) => Promise<void> | void;
  onCancel: () => void;
}

/** React Hook Form + Zod form that issues one read-only client link. */
export function ShareForm({ projectId, onCreated, onCancel }: Readonly<ShareFormProps>) {
  const notify = useNotify();
  const [createShare] = useCreateProjectShareMutation();

  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', expiresInDays: '30' },
  });

  const onSubmit = async (values: Values) => {
    try {
      const { data } = await createShare({
        variables: {
          projectId,
          label: values.label,
          expiresInDays: Number(values.expiresInDays),
        },
      });
      const url = data?.createProjectShare.url;
      if (!url) {
        throw new Error('The server returned no link');
      }
      methods.reset({ label: '', expiresInDays: values.expiresInDays });
      await onCreated(url);
    } catch (error) {
      notify(errorMessage(error, 'Could not create the link'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Create link"
    >
      <RhfTextField
        name="label"
        label="What is this link for?"
        helperText="e.g. Acme weekly update"
      />
      <RhfTextField
        name="expiresInDays"
        label="Expires in (days)"
        type="number"
        helperText={`Between 1 and ${MAX_DAYS} days`}
      />
    </EntityForm>
  );
}
