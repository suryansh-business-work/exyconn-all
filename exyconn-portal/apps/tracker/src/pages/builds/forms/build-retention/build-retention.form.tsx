import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  TrackerBuildSettingsDocument,
  useSaveTrackerBuildRetentionMutation,
} from '@exyconn/shell/graphql/generated';
import { MAX_KEEP_LATEST_BUILDS } from '../../builds.constants';
import type { BuildRetentionFormProps } from './build-retention.types';

const schema = z.object({
  keepLatestBuilds: z.coerce
    .number({ message: 'Enter a number' })
    .int('Enter a whole number')
    .min(0, 'Enter 0 or more')
    .max(MAX_KEEP_LATEST_BUILDS, 'Keep at most 500 builds'),
});
type Values = z.infer<typeof schema>;

/** React Hook Form + Zod form for how many of the newest tracker builds the hourly pass keeps. */
export function BuildRetentionForm({ keepLatestBuilds }: Readonly<BuildRetentionFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [save] = useSaveTrackerBuildRetentionMutation({
    refetchQueries: [TrackerBuildSettingsDocument],
  });
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    values: { keepLatestBuilds },
  });

  const onSubmit = async (values: Values) => {
    try {
      await save({ variables: values });
      notify('Build retention saved', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save the build retention', 'error');
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
          'Every hour, builds older than the newest ones kept here are deleted from GitHub. The newest build of each platform is always kept, so every platform still has an installer and an update.',
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
