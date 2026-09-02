import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  CampaignChannel,
  CampaignStatus,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
} from '@exyconn/shell/graphql/generated';
import type { CampaignRow } from './campaign.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  channel: z.nativeEnum(CampaignChannel),
  budget: z.coerce.number({ message: 'Budget must be a number' }).min(0, 'Must be ≥ 0'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.nativeEnum(CampaignStatus),
  subject: z.string().trim().max(150, 'Keep the subject under 150 characters'),
  body: z.string().trim().max(5000, 'Keep the body under 5000 characters'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CampaignRow | null): Values => ({
  name: row?.name ?? '',
  channel: row?.channel ?? CampaignChannel.Email,
  budget: row?.budget ?? 0,
  startDate: row?.startDate ?? '',
  endDate: row?.endDate ?? '',
  status: row?.status ?? CampaignStatus.Planned,
  subject: row?.subject ?? '',
  body: row?.body ?? '',
});

interface CampaignFormProps {
  initial: CampaignRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a campaign (incl. email content). */
export function CampaignForm({ initial, onDone, onCancel }: CampaignFormProps) {
  const notify = useNotify();
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateCampaign({ variables: { id: initial.id, input: values } });
      else await createCampaign({ variables: { input: values } });
      notify(`Campaign ${isEdit ? 'updated' : 'created'}`);
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
          <RhfSelect
            name="channel"
            label="Channel"
            options={enumOptions(Object.values(CampaignChannel))}
          />
          <RhfTextField name="budget" label="Budget" type="number" />
          <RhfDatePicker name="startDate" label="Start date" />
          <RhfDatePicker name="endDate" label="End date" />
          <RhfSelect
            name="status"
            label="Status"
            options={enumOptions(Object.values(CampaignStatus))}
          />
          <RhfTextField
            name="subject"
            label="Email subject"
            helperText="Used when you send this campaign by email."
          />
          <RhfTextField name="body" label="Email body" multiline minRows={5} />
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
