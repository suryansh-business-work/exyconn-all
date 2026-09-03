import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateGithubConfigMutation,
  useUpdateGithubConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { GithubConfigRow } from './github-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** GitHub owners and repository names allow letters, digits, dot, dash and underscore. */
const NAME_PATTERN = /^[\w.-]+$/;

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  owner: z
    .string()
    .trim()
    .min(1, 'Owner is required')
    .regex(NAME_PATTERN, 'Use the owner exactly as it appears in the repository URL'),
  repo: z
    .string()
    .trim()
    .min(1, 'Repository is required')
    .regex(NAME_PATTERN, 'Use the repository name exactly as it appears in its URL'),
  token: z.string().trim().min(1, 'Access token is required'),
  isActive: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  owner: values.owner,
  repo: values.repo,
  token: values.token,
  isActive: values.isActive === 'true',
});

const toInitial = (row: GithubConfigRow | null): Values => ({
  label: row?.label ?? '',
  owner: row?.owner ?? '',
  repo: row?.repo ?? '',
  token: row?.token ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface GithubConfigFormProps {
  initial: GithubConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update the build repository's credentials. */
export function GithubConfigForm({ initial, onDone, onCancel }: Readonly<GithubConfigFormProps>) {
  const [createConfig] = useCreateGithubConfigMutation();
  const [updateConfig] = useUpdateGithubConfigMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'GitHub config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfTextField
        name="owner"
        label="Owner"
        helperText="The user or organisation, e.g. exyconn"
      />
      <RhfTextField name="repo" label="Repository" helperText="The repository name on its own" />
      <RhfTextField
        name="token"
        label="Access token"
        type="password"
        helperText="Fine-grained token with Actions: read and write on this repository"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
