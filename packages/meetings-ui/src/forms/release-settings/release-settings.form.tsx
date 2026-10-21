import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { GITHUB_REPOSITORY } from '@exyconn/regex';
import { RhfAutocomplete, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useMaUpdateReleaseSettingsMutation } from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';
import type { ReleaseSettingsValues } from './release-settings.types';

const MAX_REPOSITORY = 201;

const schema = z.object({
  allowedRepository: z
    .string()
    .trim()
    .min(1, 'Enter the repository')
    .max(MAX_REPOSITORY, 'Keep the repository under 200 characters')
    .regex(GITHUB_REPOSITORY, 'Enter it as owner/name, e.g. acme/portal'),
  slackChannelId: z.string(),
  notifyOnNewBuild: z.boolean(),
});

interface ReleaseSettingsFormProps {
  initial: ReleaseSettingsValues;
  /** The Slack channels to choose from, with a "none" option first; empty when Slack is off. */
  channels: SelectOption[];
  onDone: () => void;
  onCancel: () => void;
}

/** Which repository may upload builds, and the Slack channel that hears about them. */
export function ReleaseSettingsForm({
  initial,
  channels,
  onDone,
  onCancel,
}: Readonly<ReleaseSettingsFormProps>) {
  // The settings have no id, so the cache cannot match the saved row to the query: read it again.
  const [save] = useMaUpdateReleaseSettingsMutation({ refetchQueries: ['MaReleaseSettings'] });
  const runNotified = useRunNotified();
  const methods = useForm<ReleaseSettingsValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const onSubmit = async (input: ReleaseSettingsValues) => {
    if (await runNotified(() => save({ variables: { input } }), 'Release settings saved')) {
      onDone();
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit onCancel={onCancel}>
      <RhfTextField
        name="allowedRepository"
        label="GitHub repository"
        required
        helperText="owner/name. Only this repository's release workflow, on main, may upload builds."
      />
      {channels.length > 0 && (
        <>
          <RhfAutocomplete
            name="slackChannelId"
            label="Slack channel"
            options={channels}
            helperText="Where a build is announced with a link to the download page once it is approved."
          />
          <RhfSwitch name="notifyOnNewBuild" label="Also post when a new build arrives for QA" />
        </>
      )}
    </EntityForm>
  );
}
