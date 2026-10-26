import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { HTTP_URL } from '@exyconn/regex';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  ProviderLinkKind,
  useSaveTechProviderLinkMutation,
} from '@exyconn/shell/graphql/generated';
import { LINK_KIND_LABELS } from '../../provider-link-kinds';
import type { ProviderLinkFormValues, ProviderLinkRow } from './provider-link.types';

const KIND_OPTIONS = Object.values(ProviderLinkKind).map((value) => ({
  value,
  label: LINK_KIND_LABELS[value].label,
}));

const schema = z.object({
  label: z.string().trim().min(1, 'Name the link').max(120, 'Keep the name under 120 characters'),
  url: z
    .string()
    .trim()
    .min(1, 'Enter the address')
    .max(2000, 'Keep the address under 2000 characters')
    .regex(HTTP_URL, 'Enter a full address starting with http:// or https://'),
  kind: z.enum(ProviderLinkKind),
}) satisfies z.ZodType<ProviderLinkFormValues>;

type Values = z.infer<typeof schema>;

interface ProviderLinkFormProps {
  provider: string;
  initial: ProviderLinkRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Adds or edits one of the team's own links for a provider (usage, billing, a runbook…). */
export function ProviderLinkForm({
  provider,
  initial,
  onDone,
  onCancel,
}: Readonly<ProviderLinkFormProps>) {
  const notify = useNotify();
  const [save] = useSaveTechProviderLinkMutation({ refetchQueries: ['TechProviderProfile'] });
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial?.label ?? '',
      url: initial?.url ?? '',
      kind: initial?.kind ?? ProviderLinkKind.Usage,
    },
  });

  const onSubmit = async (input: Values) => {
    try {
      await save({ variables: { provider, id: initial?.id ?? null, input } });
      notify(initial ? 'Link updated' : 'Link added');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Could not save the link'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={Boolean(initial)} onCancel={onCancel}>
      <RhfTextField name="label" label="Link name" helperText="e.g. Usage dashboard." />
      <RhfTextField name="url" label="Address" helperText="The full web address, https://…" />
      <RhfSelect name="kind" label="Kind" options={KIND_OPTIONS} helperText="Groups the link." />
    </EntityForm>
  );
}
