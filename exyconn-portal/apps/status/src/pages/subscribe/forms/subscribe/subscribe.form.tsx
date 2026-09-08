import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSubscribeToStatusMutation } from '@exyconn/shell/graphql/generated';
import { SUBSCRIBE_DEFAULTS, subscribeSchema } from './subscribe.schema';
import type { SubscribeFormProps } from './subscribe.types';

type Values = z.infer<typeof subscribeSchema>;

/**
 * The public "tell me when something breaks" form.
 *
 * The API answers the same way for every address it accepts — whether it is new, pending
 * or already subscribed — so this form can only ever report that a confirmation is on its
 * way. That is deliberate: a page anybody can load must not become a way to ask who
 * follows our outages.
 */
export function SubscribeForm({ onSubmitted }: Readonly<SubscribeFormProps>) {
  const [subscribe] = useSubscribeToStatusMutation();
  const notify = useNotify();
  const methods = useForm<z.input<typeof subscribeSchema>, unknown, Values>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: SUBSCRIBE_DEFAULTS,
  });

  const onSubmit = async (values: Values) => {
    try {
      await subscribe({ variables: { email: values.email } });
      methods.reset(SUBSCRIBE_DEFAULTS);
      onSubmitted(values.email);
    } catch (error) {
      notify(errorMessage(error, 'Could not subscribe you just now'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={() => methods.reset(SUBSCRIBE_DEFAULTS)}
      submitLabel="Email me updates"
    >
      <RhfTextField
        name="email"
        label="Your email"
        helperText="We email when something breaks and again when it is fixed. Nothing else."
      />
    </EntityForm>
  );
}
