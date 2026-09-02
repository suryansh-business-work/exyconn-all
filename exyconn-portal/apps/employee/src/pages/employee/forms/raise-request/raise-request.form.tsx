import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { RequestType, useCreateMyRequestMutation } from '@exyconn/shell/graphql/generated';

const schema = z.object({
  type: z.nativeEnum(RequestType),
  subject: z.string().trim().min(1, 'Subject is required').max(120, 'Keep it under 120 characters'),
  details: z.string().trim().min(10, 'Give HR enough detail to act on (10+ characters)'),
});
type Values = z.infer<typeof schema>;

const INITIAL: Values = { type: RequestType.Wfh, subject: '', details: '' };

interface RaiseRequestFormProps {
  onCancel: () => void;
  onDone: () => void;
}

/** React Hook Form + Zod form for an employee to raise their own HR request. */
export function RaiseRequestForm({ onCancel, onDone }: Readonly<RaiseRequestFormProps>) {
  const notify = useNotify();
  const [createMyRequest] = useCreateMyRequestMutation();
  const methods = useForm<Values>({ resolver: zodResolver(schema), defaultValues: INITIAL });

  const onSubmit = async (values: Values) => {
    try {
      await createMyRequest({ variables: { input: values } });
      notify('Request submitted — pending approval');
      methods.reset();
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not submit the request', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Submit"
    >
      <RhfSelect
        name="type"
        label="Request type"
        options={enumOptions(Object.values(RequestType))}
      />
      <RhfTextField name="subject" label="Subject" />
      <RhfTextField name="details" label="Details" multiline minRows={4} />
    </EntityForm>
  );
}
