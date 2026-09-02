import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfSelect,
  RhfChipsInput,
  RhfSwitch,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateGigMutation,
  useUpdateGigMutation,
  type GigInput,
} from '@exyconn/shell/graphql/generated';
import {
  GIG_APPLICATION_TYPES,
  GIG_CATEGORIES,
  GIG_DURATIONS,
  GIG_STATUSES,
  toOptions,
} from '../../website.constants';
import type { GigRow } from './gig.types';

const schema = z.object({
  gigCode: z.string().trim().min(1, 'Gig code is required'),
  title: z.string().trim().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  shortDescription: z.string(),
  fullDescription: z.string(),
  deliverables: z.array(z.string()),
  requirements: z.array(z.string()),
  tags: z.array(z.string()),
  budget: z.string(),
  duration: z.string().min(1, 'Duration is required'),
  status: z.string().min(1, 'Status is required'),
  applicationType: z.string().min(1, 'Application type is required'),
  applicationContact: z.string().trim().min(1, 'Application contact is required'),
  postedDate: z.string(),
  deadline: z.string(),
  isUrgent: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: GigRow | null): Values => ({
  gigCode: row?.gigCode ?? '',
  title: row?.title ?? '',
  category: row?.category ?? '',
  shortDescription: row?.shortDescription ?? '',
  fullDescription: row?.fullDescription ?? '',
  deliverables: row?.deliverables ?? [],
  requirements: row?.requirements ?? [],
  tags: row?.tags ?? [],
  budget: row?.budget ?? '',
  duration: row?.duration ?? '',
  status: row?.status ?? '',
  applicationType: row?.applicationType ?? '',
  applicationContact: row?.applicationContact ?? '',
  postedDate: row?.postedDate ?? '',
  deadline: row?.deadline ?? '',
  isUrgent: row?.isUrgent ?? false,
});

/** An empty date picker yields '', which is not a valid DateTime — send null instead. */
const toInput = (values: Values): GigInput => ({
  ...values,
  postedDate: values.postedDate || null,
  deadline: values.deadline || null,
});

interface GigFormProps {
  initial: GigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a gig. */
export function GigForm({ initial, onDone, onCancel }: Readonly<GigFormProps>) {
  const notify = useNotify();
  const [createGig] = useCreateGigMutation();
  const [updateGig] = useUpdateGigMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = toInput(values);
    try {
      if (isEdit && initial) await updateGig({ variables: { id: initial.id, input } });
      else await createGig({ variables: { input } });
      notify(`Gig ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="gigCode" label="Gig code" helperText="Unique code, e.g. GIG-001" />
          <RhfTextField name="title" label="Title" />
          <RhfSelect name="category" label="Category" options={toOptions(GIG_CATEGORIES)} />
          <RhfTextField name="shortDescription" label="Short description" multiline minRows={2} />
          <RhfTextField
            name="fullDescription"
            label="Full description"
            multiline
            minRows={8}
            helperText="HTML is allowed — the body is rendered as-is on the public site."
          />
          <RhfChipsInput name="deliverables" label="Deliverables" />
          <RhfChipsInput name="requirements" label="Requirements" />
          <RhfChipsInput name="tags" label="Tags" />
          <RhfTextField name="budget" label="Budget" helperText="e.g. ₹25,000 - ₹40,000" />
          <RhfSelect name="duration" label="Duration" options={toOptions(GIG_DURATIONS)} />
          <RhfSelect name="status" label="Status" options={toOptions(GIG_STATUSES)} />
          <RhfSelect
            name="applicationType"
            label="Application type"
            options={toOptions(GIG_APPLICATION_TYPES)}
          />
          <RhfTextField
            name="applicationContact"
            label="Application contact"
            helperText="Email, form URL or WhatsApp number, matching the application type."
          />
          <RhfDatePicker name="postedDate" label="Posted date" />
          <RhfDatePicker name="deadline" label="Deadline" />
          <RhfSwitch name="isUrgent" label="Urgent" />
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
