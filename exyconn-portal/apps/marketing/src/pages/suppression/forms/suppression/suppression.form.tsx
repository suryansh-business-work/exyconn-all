import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';
import { RhfTextField, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SuppressionReason,
  useCreateMarketingSuppressionMutation,
  useUpdateMarketingSuppressionMutation,
} from '@exyconn/shell/graphql/generated';
import type { SuppressionRow } from './suppression.types';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
  reason: z.nativeEnum(SuppressionReason),
  source: z.string().trim().max(200, 'Keep the note under 200 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: SuppressionRow | null): Values => ({
  email: row?.email ?? '',
  reason: row?.reason ?? SuppressionReason.Manual,
  source: row?.source ?? '',
});

interface SuppressionFormProps {
  initial: SuppressionRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Adds an address by hand — a request that arrived by phone, or a list from a partner. */
export function SuppressionForm({ initial, onDone, onCancel }: Readonly<SuppressionFormProps>) {
  const [createSuppression] = useCreateMarketingSuppressionMutation();
  const [updateSuppression] = useUpdateMarketingSuppressionMutation();
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Suppression',
    initial,
    create: (values: Values) => createSuppression({ variables: { input: values } }),
    update: (row, values) => updateSuppression({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField
        name="email"
        label="Email"
        type="email"
        helperText="No campaign will ever be sent to this address again."
      />
      <RhfSelect
        name="reason"
        label="Reason"
        options={enumOptions(Object.values(SuppressionReason))}
      />
      <RhfTextField name="source" label="Note" helperText="Where this came from, for the record." />
    </EntityForm>
  );
}
