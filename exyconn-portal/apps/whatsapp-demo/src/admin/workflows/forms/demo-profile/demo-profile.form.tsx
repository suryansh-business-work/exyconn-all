import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useUpsertWhatsappDemoMutation } from '@exyconn/shell/graphql/generated';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { Divider } from '@exyconn/shell/components/ui';
import { DEMO_QUERIES, toDemoProfile } from '../../model/api';
import { DemoBusinessFields } from './DemoBusinessFields';
import { DemoChatFields } from './DemoChatFields';
import { demoProfileSchema } from './demo-profile.schema';
import type { DemoProfileFormProps, DemoProfileValues } from './demo-profile.types';

/** A new demo starts valid except for what only its author can know. */
const BLANK: DemoProfileValues = {
  key: '',
  industry: '',
  business: {
    name: '',
    tagline: '',
    category: '',
    about: '',
    icon: 'business',
    accent: 'teal',
    verified: true,
    phone: '',
    email: '',
    website: '',
    address: '',
    hours: '',
  },
  greeting: 'Hi {{user.firstName}}, welcome.',
  menuText: 'What would you like to do?',
  menuButton: 'View options',
  order: 0,
  active: true,
};

/** Create or update a demo's profile (React Hook Form + Zod) → `upsertWhatsappDemo`. */
export function DemoProfileForm({ demo, onSaved, onCancel }: Readonly<DemoProfileFormProps>) {
  const notify = useNotify();
  const [upsert] = useUpsertWhatsappDemoMutation({ refetchQueries: DEMO_QUERIES });
  const methods = useForm<z.input<typeof demoProfileSchema>, unknown, DemoProfileValues>({
    mode: 'onTouched',
    resolver: zodResolver(demoProfileSchema),
    defaultValues: demo ? toDemoProfile(demo) : BLANK,
  });

  const onSubmit = async (values: DemoProfileValues) => {
    try {
      const result = await upsert({ variables: { id: demo?.id ?? null, input: values } });
      const saved = result.data?.upsertWhatsappDemo;
      if (saved) {
        methods.reset(toDemoProfile(saved));
        notify('Demo saved', 'success');
        onSaved(saved.id);
      }
    } catch (error) {
      console.error('Could not save the demo', error);
      notify(errorMessage(error, 'Could not save the demo'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={Boolean(demo)} onCancel={onCancel}>
      <DemoChatFields isEdit={Boolean(demo)} />
      <Divider />
      <DemoBusinessFields />
    </EntityForm>
  );
}
