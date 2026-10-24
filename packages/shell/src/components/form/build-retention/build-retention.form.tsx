import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { zodResolver } from '@/components/form/zodResolver';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { MAX_KEEP_LATEST_BUILDS, type BuildRetentionFormProps } from './build-retention.types';

const schema = z.object({
  keepLatestBuilds: z.coerce
    .number({ message: 'Enter a number' })
    .int('Enter a whole number')
    .min(0, 'Enter 0 or more')
    .max(MAX_KEEP_LATEST_BUILDS, 'Keep at most 500 builds'),
});
type Values = z.infer<typeof schema>;

/**
 * React Hook Form + Zod form for how many of the newest builds an hourly pass keeps — tracker
 * installers, extension builds. The page passes its own save; this form owns the checks and the
 * feedback, so every product explains retention the same way.
 */
export function BuildRetentionForm({ keepLatestBuilds, save }: Readonly<BuildRetentionFormProps>) {
  const t = useT();
  const notify = useNotify();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    values: { keepLatestBuilds },
  });

  const onSubmit = async (values: Values) => {
    try {
      await save(values.keepLatestBuilds);
      notify('Build retention saved', 'success');
    } catch (error) {
      notify(errorMessage(error, 'Could not save the build retention'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={() => methods.reset({ keepLatestBuilds })}
      submitLabel="Save"
    >
      <Text size="sm" color="text.secondary">
        {t(
          'Every hour, builds older than the newest ones kept here are deleted. The newest build people can install is always kept, so nobody is left without an installer or an update.',
        )}
      </Text>
      <RhfTextField
        name="keepLatestBuilds"
        label="Builds to keep"
        type="number"
        helperText="How many of the newest builds to keep, 0 to 500. 0 keeps every build."
      />
    </EntityForm>
  );
}
