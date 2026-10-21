import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import type { z } from 'zod';
import {
  RhfSecretField,
  RhfTextField,
  RhfSelect,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateFirecrawlConfigMutation,
  useUpdateFirecrawlConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';

/** What the API key field says on a new config. */
const NEW_KEY_HINT =
  'Required for api.firecrawl.dev (get a key at firecrawl.dev, starts with fc-). Leave empty for a self-hosted Firecrawl without authentication';
import {
  FIRECRAWL_DEFAULT_BASE_URL,
  makeFirecrawlConfigSchema,
  type FirecrawlConfigRow,
  type FirecrawlConfigSchema,
  type FirecrawlConfigValues,
} from './firecrawl-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const toInput = ({ isActive, ...values }: FirecrawlConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});

const toInitial = (row: FirecrawlConfigRow | null): FirecrawlConfigValues => ({
  label: row?.label ?? '',
  baseUrl: row?.baseUrl ?? FIRECRAWL_DEFAULT_BASE_URL,
  // Never prefilled: the API does not return it, and blank keeps the stored key.
  apiKey: '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface FirecrawlConfigFormProps {
  initial: FirecrawlConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for the Firecrawl install behind the CRM website scraper: the
 * hosted API with its key, or a self-hosted Firecrawl that may need none.
 */
export function FirecrawlConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<FirecrawlConfigFormProps>) {
  const [createConfig] = useCreateFirecrawlConfigMutation();
  const [updateConfig] = useUpdateFirecrawlConfigMutation();
  const methods = useForm<z.input<FirecrawlConfigSchema>, unknown, FirecrawlConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeFirecrawlConfigSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Firecrawl config',
    initial,
    create: (values: FirecrawlConfigValues) =>
      createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="label"
        label="Label"
        helperText="A name to tell configs apart, e.g. Production."
      />
      <RhfTextField
        name="baseUrl"
        label="Base URL"
        helperText="https://api.firecrawl.dev for Firecrawl's hosted API, or the address of a self-hosted Firecrawl"
      />
      <RhfSecretField
        name="apiKey"
        label="API key"
        stored={initial?.hasApiKey}
        helperText={isEdit ? KEEP_SECRET_HINT : NEW_KEY_HINT}
      />
      <RhfSelect
        name="isActive"
        label="Set as active"
        options={BOOL_OPTIONS}
        helperText="Only one config is active at a time; the server uses that one."
      />
    </EntityForm>
  );
}
