import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HTTP_URL, SONAR_PROJECT_KEY } from '@exyconn/regex';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateSonarConfigMutation,
  useUpdateSonarConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { SonarConfigFormValues, SonarConfigRow } from './sonar-config.types';
import { KEEP_SECRET_HINT, secretField } from '../../secret';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** The token is write-only: required to create, blank on an edit keeps the stored one. */
const makeSchema = (isEdit: boolean) =>
  z.object({
    label: z
      .string()
      .trim()
      .min(1, 'Label is required')
      .max(80, 'Keep the label under 80 characters'),
    hostUrl: z
      .string()
      .trim()
      .min(1, 'Server URL is required')
      .regex(HTTP_URL, 'Enter a valid URL')
      .refine((value) => value.toLowerCase().startsWith('https://'), 'Use an https:// address'),
    token: secretField(isEdit, 'Token is required'),
    projectKey: z
      .string()
      .trim()
      .min(1, 'Project key is required')
      .max(400, 'A project key is at most 400 characters')
      .regex(SONAR_PROJECT_KEY, 'Use the project key exactly as SonarQube shows it'),
    organization: z
      .string()
      .trim()
      .max(255, 'An organization key is at most 255 characters')
      .refine(
        (value) => value === '' || SONAR_PROJECT_KEY.test(value),
        'Use the organization key, not its name',
      ),
    isActive: z.enum(['true', 'false']),
  });
type Schema = ReturnType<typeof makeSchema>;
type Values = z.infer<Schema>;

/** Maps the validated form values onto the GraphQL input. */
const toInput = (values: Values) => ({
  label: values.label,
  hostUrl: values.hostUrl,
  token: values.token,
  projectKey: values.projectKey,
  organization: values.organization,
  isActive: values.isActive === 'true',
});

/** A new config starts active, since it is usually the only one. */
function activeValue(row: SonarConfigRow | null): SonarConfigFormValues['isActive'] {
  if (row && !row.isActive) {
    return 'false';
  }
  return 'true';
}

const toInitial = (row: SonarConfigRow | null): SonarConfigFormValues => ({
  label: row?.label ?? '',
  hostUrl: row?.hostUrl ?? '',
  // Never prefilled: the API does not return it, and blank keeps the stored token.
  token: '',
  projectKey: row?.projectKey ?? '',
  organization: row?.organization ?? '',
  isActive: activeValue(row),
});

interface SonarConfigFormProps {
  initial: SonarConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update the SonarQube project the Security screen reads. */
export function SonarConfigForm({ initial, onDone, onCancel }: Readonly<SonarConfigFormProps>) {
  const [createConfig] = useCreateSonarConfigMutation();
  const [updateConfig] = useUpdateSonarConfigMutation();
  const methods = useForm<z.input<Schema>, unknown, Values>({
    mode: 'onTouched',
    resolver: zodResolver(makeSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'SonarQube config',
    initial,
    create: (values: Values) => createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" helperText="A name to tell configs apart" />
      <RhfTextField
        name="hostUrl"
        label="Server URL"
        helperText="e.g. https://sonarcloud.io or your SonarQube address"
      />
      <RhfTextField
        name="token"
        label="Token"
        type="password"
        helperText={
          isEdit ? KEEP_SECRET_HINT : 'A user token with Browse permission on the project'
        }
      />
      <RhfTextField
        name="projectKey"
        label="Project key"
        helperText="Shown under Project Information in SonarQube"
      />
      <RhfTextField
        name="organization"
        label="Organization key"
        helperText="SonarCloud only; leave blank for a self-hosted SonarQube"
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
