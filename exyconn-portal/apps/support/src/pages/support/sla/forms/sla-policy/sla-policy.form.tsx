import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportPriority,
  useCreateSupportSlaPolicyMutation,
  useUpdateSupportSlaPolicyMutation,
} from '@exyconn/shell/graphql/generated';
import { SLA_MINUTE_LIMITS, type SlaPolicyRow } from './sla-policy.types';

const { min, max } = SLA_MINUTE_LIMITS;

const minutes = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be whole minutes`)
    .min(min, `${label} must be at least ${min} minute`)
    .max(max, `${label} must be at most ${max} minutes`);

const schema = z
  .object({
    priority: z.nativeEnum(SupportPriority),
    firstResponseMinutes: minutes('First response'),
    resolutionMinutes: minutes('Resolution'),
    active: z.boolean(),
  })
  .refine((values) => values.firstResponseMinutes <= values.resolutionMinutes, {
    path: ['firstResponseMinutes'],
    message: 'A first response cannot be promised later than the resolution',
  });
type Values = z.infer<typeof schema>;

const toInitial = (row: SlaPolicyRow | null): Values => ({
  priority: row?.priority ?? SupportPriority.Medium,
  firstResponseMinutes: row?.firstResponseMinutes ?? 240,
  resolutionMinutes: row?.resolutionMinutes ?? 1440,
  active: row?.active ?? true,
});

interface SlaPolicyFormProps {
  initial: SlaPolicyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for one SLA promise. The cross-field rule is the whole
 * point of the screen: promising an answer after the deadline for finishing is not a
 * policy anybody could keep.
 */
export function SlaPolicyForm({ initial, onDone, onCancel }: Readonly<SlaPolicyFormProps>) {
  const [createPolicy] = useCreateSupportSlaPolicyMutation();
  const [updatePolicy] = useUpdateSupportSlaPolicyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'SLA policy',
    initial,
    create: (values: Values) => createPolicy({ variables: { input: values } }),
    update: (row, values) => updatePolicy({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfSelect
        name="priority"
        label="Priority"
        options={enumOptions(Object.values(SupportPriority))}
      />
      <RhfTextField
        name="firstResponseMinutes"
        label="First response (minutes)"
        type="number"
        helperText="How long a ticket may wait before somebody answers it."
      />
      <RhfTextField
        name="resolutionMinutes"
        label="Resolution (minutes)"
        type="number"
        helperText="How long it may take to finish. This is the deadline the SLA state measures."
      />
      <RhfSwitch name="active" label="Active" />
    </EntityForm>
  );
}
