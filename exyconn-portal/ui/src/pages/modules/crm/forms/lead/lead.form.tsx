import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@/components/ui';
import { RhfTextField, RhfSelect } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { enumOptions } from '@/utils/enumOptions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  LeadSource,
  LeadStage,
  useCreateLeadMutation,
  useUpdateLeadMutation,
} from '@/graphql/generated';
import type { LeadRow } from './lead.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  source: z.nativeEnum(LeadSource),
  stage: z.nativeEnum(LeadStage),
  value: z.coerce.number({ message: 'Value must be a number' }).min(0, 'Must be ≥ 0'),
  owner: z.string().trim().min(1, 'Owner is required'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: LeadRow | null): Values => ({
  name: row?.name ?? '',
  email: row?.email ?? '',
  source: row?.source ?? LeadSource.Website,
  stage: row?.stage ?? LeadStage.New,
  value: row?.value ?? 0,
  owner: row?.owner ?? '',
});

interface LeadFormProps {
  initial: LeadRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a lead. */
export function LeadForm({ initial, onDone, onCancel }: LeadFormProps) {
  const notify = useNotify();
  const [createLead] = useCreateLeadMutation();
  const [updateLead] = useUpdateLeadMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateLead({ variables: { id: initial.id, input: values } });
      else await createLead({ variables: { input: values } });
      notify(`Lead ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="name" label="Name" />
          <RhfTextField name="email" label="Email" type="email" />
          <RhfSelect
            name="source"
            label="Source"
            options={enumOptions(Object.values(LeadSource))}
          />
          <RhfSelect name="stage" label="Stage" options={enumOptions(Object.values(LeadStage))} />
          <RhfTextField name="value" label="Value" type="number" />
          <RhfTextField name="owner" label="Owner" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
