import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Divider } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
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
  const [createJob] = useCreateJobMutation();
  const [updateJob] = useUpdateJobMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Job',
    initial,
    create: (values: Values) => createJob({ variables: { input: toInput(values) } }),
    update: (row, values) => updateJob({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <JobDetailsFields />
      <Divider />
      <JobContentFields />
    </EntityForm>
  );
}
