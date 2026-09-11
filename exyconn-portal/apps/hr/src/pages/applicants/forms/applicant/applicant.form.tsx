import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EMAIL, HTTP_URL, PHONE, SLUG } from '@exyconn/regex';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  ApplicantSource,
  useCreateApplicantMutation,
  useUpdateApplicantMutation,
} from '@exyconn/shell/graphql/generated';
import { RATING_OPTIONS, SOURCE_OPTIONS } from '../../applicants.constants';
import type { ApplicantFormValues, ApplicantRow } from './applicant.types';

export const applicantSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80, 'Keep the name under 80 characters'),
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .max(40, 'Keep the phone number under 40 characters')
    .regex(PHONE, 'Enter a valid phone number')
    .or(z.literal('')),
  jobCode: z.string().trim().max(40, 'Keep the job code under 40 characters'),
  jobTitle: z.string().trim().min(2, 'Job title is required').max(120, 'Keep the title short'),
  companySlug: z
    .string()
    .trim()
    .max(80, 'Keep the company slug under 80 characters')
    .regex(SLUG, 'Lower-case letters, numbers and hyphens only')
    .or(z.literal('')),
  resumeUrl: z
    .string()
    .trim()
    .max(500, 'That link is too long')
    .regex(HTTP_URL, 'Enter a full URL starting with https://')
    .or(z.literal('')),
  coverLetter: z.string().trim().max(8000, 'Keep the cover letter under 8000 characters'),
  source: z.nativeEnum(ApplicantSource),
  rating: z.coerce.number().int().min(0).max(5),
});

type Values = z.infer<typeof applicantSchema>;

export function toApplicantValues(row: ApplicantRow | null): ApplicantFormValues {
  return {
    name: row?.name ?? '',
    email: row?.email ?? '',
    phone: row?.phone ?? '',
    jobCode: row?.jobCode ?? '',
    jobTitle: row?.jobTitle ?? '',
    companySlug: row?.companySlug ?? '',
    resumeUrl: row?.resumeUrl ?? '',
    coverLetter: row?.coverLetter ?? '',
    source: row?.source ?? ApplicantSource.Manual,
    rating: row?.rating ?? 0,
  };
}

interface ApplicantFormProps {
  initial: ApplicantRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Add a referral or walk-in by hand, or correct an applicant's details. */
export function ApplicantForm({ initial, onDone, onCancel }: Readonly<ApplicantFormProps>) {
  const [createApplicant] = useCreateApplicantMutation();
  const [updateApplicant] = useUpdateApplicantMutation();
  const methods = useForm<z.input<typeof applicantSchema>, unknown, Values>({
    resolver: zodResolver(applicantSchema),
    defaultValues: toApplicantValues(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Applicant',
    initial,
    create: (values: Values) => createApplicant({ variables: { input: values } }),
    update: (row: ApplicantRow, values: Values) =>
      updateApplicant({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Full name" />
      <RhfTextField name="email" label="Email" helperText="Stage emails go here" />
      <RhfTextField name="phone" label="Phone" />
      <RhfTextField name="jobTitle" label="Job title" />
      <RhfTextField
        name="jobCode"
        label="Job code"
        helperText="From the website posting, e.g. GRP-SM-001"
      />
      <RhfTextField name="companySlug" label="Company slug" />
      <RhfSelect name="source" label="Source" options={SOURCE_OPTIONS} />
      <RhfSelect name="rating" label="Rating" options={RATING_OPTIONS} />
      <RhfTextField
        name="resumeUrl"
        label="Resume link"
        helperText="A URL, or the file name if it arrived by email"
      />
      <RhfTextField name="coverLetter" label="Cover letter" multiline rows={5} />
    </EntityForm>
  );
}
