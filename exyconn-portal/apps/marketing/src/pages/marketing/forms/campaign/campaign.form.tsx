import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfDateTimePicker,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  CampaignChannel,
  CampaignStatus,
  useListAudienceListsQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
} from '@exyconn/shell/graphql/generated';
import type { CampaignRow } from './campaign.types';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    channel: z.nativeEnum(CampaignChannel),
    budget: z.coerce.number({ message: 'Budget must be a number' }).min(0, 'Must be ≥ 0'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    status: z.nativeEnum(CampaignStatus),
    subject: z.string().trim().max(150, 'Keep the subject under 150 characters'),
    body: z.string().trim().max(5000, 'Keep the body under 5000 characters'),
    templateKey: z.string().trim(),
    scheduledAt: z.string(),
    scheduledAudienceListId: z.string(),
  })
  .refine((values) => !values.scheduledAt || values.scheduledAudienceListId.length > 0, {
    path: ['scheduledAudienceListId'],
    message: 'A scheduled send needs an audience',
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
  templateKey: row?.templateKey ?? '',
  scheduledAt: row?.scheduledAt ?? '',
  scheduledAudienceListId: row?.scheduledAudienceListId ?? '',
});

/** An unset schedule is null on the wire, not an empty string a DateTime scalar would reject. */
const toInput = (values: Values) => ({ ...values, scheduledAt: values.scheduledAt || null });

interface CampaignFormProps {
  initial: CampaignRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a campaign (incl. email content). */
export function CampaignForm({ initial, onDone, onCancel }: Readonly<CampaignFormProps>) {
  const { data } = useListAudienceListsQuery();
  const [createCampaign] = useCreateCampaignMutation();
  const [updateCampaign] = useUpdateCampaignMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const audienceOptions: SelectOption[] = (data?.listAudienceLists ?? []).map((audience) => ({
    value: audience.id,
    label: audience.name,
  }));

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Campaign',
    initial,
    create: (values: Values) => createCampaign({ variables: { input: toInput(values) } }),
    update: (row, values) => updateCampaign({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
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
        helperText="Merge fields work here too: {{name}}, {{email}}, {{company}}."
      />
      <RhfTextField
        name="body"
        label="Email body"
        multiline
        minRows={5}
        helperText="Use {{name}}, {{email}}, {{company}} and {{unsubscribeUrl}} to personalise it."
      />
      <RhfTextField
        name="templateKey"
        label="Email template key"
        helperText="Optional. A template authored in Tech → Email, e.g. newsletter."
      />
      <RhfDateTimePicker
        name="scheduledAt"
        label="Send automatically at"
        helperText="Optional. Leave empty to send this campaign by hand."
      />
      <RhfSelect
        name="scheduledAudienceListId"
        label="Scheduled audience"
        options={audienceOptions}
        helperText={audienceOptions.length ? undefined : 'No audiences yet — create one first.'}
      />
    </EntityForm>
  );
}
