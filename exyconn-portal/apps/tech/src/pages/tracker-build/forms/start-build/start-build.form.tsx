import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfMultiSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { TrackerPlatform, useStartTrackerBuildMutation } from '@exyconn/shell/graphql/generated';
import { BUILD_PLATFORMS, DEFAULT_BUILD_REF } from '../../trackerBuild.constants';

const PLATFORM_OPTIONS = BUILD_PLATFORMS.map((p) => ({
  value: p.value as string,
  label: `${p.label} — ${p.artifact}`,
}));

const schema = z.object({
  platforms: z
    .array(z.nativeEnum(TrackerPlatform))
    .min(1, 'Choose at least one installer to build'),
  ref: z.string().trim().min(1, 'Branch is required'),
});
type Values = z.infer<typeof schema>;

interface StartBuildFormProps {
  channelCount: number;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to start a tracker build for the chosen installers. */
export function StartBuildForm({ channelCount, onDone, onCancel }: Readonly<StartBuildFormProps>) {
  const notify = useNotify();
  const [startBuild] = useStartTrackerBuildMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { platforms: [], ref: DEFAULT_BUILD_REF },
  });

  const onSubmit = async ({ platforms, ref }: Values) => {
    try {
      await startBuild({ variables: { platforms, ref } });
      notify(`Build started for ${platforms.length} installer(s) on ${ref}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not start the build', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Start build"
    >
      <Text size="sm" color="text.secondary">
        Pick the installers to build. Each one is built on its own runner, published on a GitHub
        release, and posted to the {channelCount} Slack channel(s) chosen in Settings.
      </Text>
      <RhfMultiSelect name="platforms" label="Installers to build" options={PLATFORM_OPTIONS} />
      <RhfTextField name="ref" label="Branch" helperText="The branch the build runs off" />
    </EntityForm>
  );
}
