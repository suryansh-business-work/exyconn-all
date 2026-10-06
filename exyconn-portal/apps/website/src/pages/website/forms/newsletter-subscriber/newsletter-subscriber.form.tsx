import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useAddNewsletterSubscriberMutation } from '@exyconn/shell/graphql/generated';
import {
  subscriberSchema,
  type NewsletterSubscriberFormValues,
  type NewsletterSubscriberRow,
} from './newsletter-subscriber.types';

interface NewsletterSubscriberFormProps {
  siteId: string;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Adds a subscriber by hand — somebody who agreed elsewhere. An address already on the list is
 * subscribed again rather than duplicated.
 */
export function NewsletterSubscriberForm({
  siteId,
  onDone,
  onCancel,
}: Readonly<NewsletterSubscriberFormProps>) {
  const [addSubscriber] = useAddNewsletterSubscriberMutation();
  const methods = useForm<NewsletterSubscriberFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(subscriberSchema),
    defaultValues: { email: '', name: '' },
  });
  const { onSubmit } = useEntitySave<NewsletterSubscriberFormValues, NewsletterSubscriberRow>({
    label: 'Subscriber',
    initial: null,
    create: (values) =>
      addSubscriber({ variables: { siteId, email: values.email, name: values.name || null } }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Add subscriber"
    >
      <RhfTextField name="email" label="Email" type="email" />
      <RhfTextField name="name" label="Name" />
    </EntityForm>
  );
}
