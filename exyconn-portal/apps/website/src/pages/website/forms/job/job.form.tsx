import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Divider, Flex } from '@exyconn/shell/components/ui';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateJobMutation,
  useUpdateJobMutation,
  type JobInput,
} from '@exyconn/shell/graphql/generated';
import { JobDetailsFields } from './job-details.fields';
import { JobContentFields } from './job-content.fields';
import type { JobRow } from './job.types';

const schema = z.object({
  jobCode: z.string().trim().min(1, 'Job code is required'),
  companySlug: z.string().trim().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Title is required'),
  category: z.string().trim().min(1, 'Category is required'),
  skillSet: z.array(z.string()),
  shortJobDescription: z.string().trim(),
  jobDescription: z.string().trim(),
  jobResponsibilities: z.string().trim(),
  requirements: z.array(z.string()),
  niceToHave: z.array(z.string()),
  benefits: z.array(z.string()),
  location: z.string().trim(),
  jobType: z.string().trim().min(1, 'Job type is required'),
  experienceLevel: z.string().trim().min(1, 'Experience level is required'),
  workMode: z.string().trim().min(1, 'Work mode is required'),
  salaryRange: z.string().trim(),
  jobPostDate: z.string(),
  applicationDeadline: z.string(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: JobRow | null): Values => ({
  jobCode: row?.jobCode ?? '',
  companySlug: row?.companySlug ?? '',
  title: row?.title ?? '',
  category: row?.category ?? '',
  skillSet: row?.skillSet ?? [],
  shortJobDescription: row?.shortJobDescription ?? '',
  jobDescription: row?.jobDescription ?? '',
  jobResponsibilities: row?.jobResponsibilities ?? '',
  requirements: row?.requirements ?? [],
  niceToHave: row?.niceToHave ?? [],
  benefits: row?.benefits ?? [],
  location: row?.location ?? '',
  jobType: row?.jobType ?? '',
  experienceLevel: row?.experienceLevel ?? '',
  workMode: row?.workMode ?? '',
  salaryRange: row?.salaryRange ?? '',
  jobPostDate: row?.jobPostDate ?? '',
  applicationDeadline: row?.applicationDeadline ?? '',
  isActive: row?.isActive ?? true,
  isFeatured: row?.isFeatured ?? false,
});

/** The DateTime scalar rejects "" — an untouched picker must be sent as null. */
const emptyToNull = (value: string) => (value === '' ? null : value);

const toInput = (values: Values): JobInput => ({
  ...values,
  jobPostDate: emptyToNull(values.jobPostDate),
  applicationDeadline: emptyToNull(values.applicationDeadline),
});

interface JobFormProps {
  initial: JobRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a job posting. */
export function JobForm({ initial, onDone, onCancel }: Readonly<JobFormProps>) {
  const notify = useNotify();
  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = toInput(values);
    try {
      if (isEdit && initial) {
        await updateJob({ variables: { id: initial.id, input } });
      } else {
        await createJob({ variables: { input } });
      }
      notify(`Job ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <JobDetailsFields />
          <Divider />
          <JobContentFields />
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
