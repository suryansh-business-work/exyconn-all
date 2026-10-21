import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { MaReleaseChannel } from '@exyconn/shell/graphql/generated';
import type { ReleaseChannelValues } from './release-channel.types';

const schema = z.object({
  channel: z.enum(MaReleaseChannel, 'Choose a release channel'),
});

interface ReleaseChannelFormProps {
  defaultChannel: MaReleaseChannel;
  submitLabel: string;
  /** Saves the choice, resolving to whether it worked so the dialog can close. */
  onSubmit: (channel: MaReleaseChannel) => Promise<boolean>;
  onDone: () => void;
  onCancel: () => void;
}

/** Picks the channel a build is approved for, or built on. */
export function ReleaseChannelForm({
  defaultChannel,
  submitLabel,
  onSubmit,
  onDone,
  onCancel,
}: Readonly<ReleaseChannelFormProps>) {
  const t = useT();
  const methods = useForm<ReleaseChannelValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { channel: defaultChannel },
  });
  const channels = enumOptions(Object.values(MaReleaseChannel)).map((option) => ({
    ...option,
    label: t(option.label),
  }));

  const submit = async (values: ReleaseChannelValues) => {
    if (await onSubmit(values.channel)) {
      onDone();
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={submit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel={submitLabel}
    >
      <RhfSelect
        name="channel"
        label="Release channel"
        required
        options={channels}
        helperText="Each company gets builds from the channel set in Meeting Assistant settings. Stable reaches every company."
      />
    </EntityForm>
  );
}
