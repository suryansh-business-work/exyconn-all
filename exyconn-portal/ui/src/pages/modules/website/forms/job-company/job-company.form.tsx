import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Divider, Flex, Typography } from '@/components/ui';
import { RhfTextField, RhfSwitch } from '@/components/form/rhf';
import { FormActions } from '@/components/form/FormActions';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useCreateJobCompanyMutation, useUpdateJobCompanyMutation } from '@/graphql/generated';
import { CompanyBenefitsFields } from './company-benefits.fields';
import type { JobCompanyRow } from './job-company.types';

const benefitSchema = z.object({
  icon: z.string().trim().min(1, 'Icon is required'),
  title: z.string().trim().min(1, 'Benefit title is required'),
  description: z.string().trim(),
});

const schema = z.object({
  companyCode: z.string().trim().min(1, 'Company code is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  name: z.string().trim().min(1, 'Name is required'),
  logo: z.string().trim(),
  tagline: z.string().trim(),
  description: z.string().trim(),
  culture: z.string().trim(),
  website: z.string().trim(),
  founded: z.string().trim(),
  employees: z.string().trim(),
  industry: z.string().trim(),
  headquarters: z.string().trim(),
  benefits: z.array(benefitSchema),
  socialLinks: z.object({
    linkedin: z.string().trim(),
    twitter: z.string().trim(),
    facebook: z.string().trim(),
    instagram: z.string().trim(),
  }),
  brandColor: z.string().trim(),
  secondaryColor: z.string().trim(),
  isActive: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Order must be ≥ 0'),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: JobCompanyRow | null): Values => ({
  companyCode: row?.companyCode ?? '',
  slug: row?.slug ?? '',
  name: row?.name ?? '',
  logo: row?.logo ?? '',
  tagline: row?.tagline ?? '',
  description: row?.description ?? '',
  culture: row?.culture ?? '',
  website: row?.website ?? '',
  founded: row?.founded ?? '',
  employees: row?.employees ?? '',
  industry: row?.industry ?? '',
  headquarters: row?.headquarters ?? '',
  benefits: (row?.benefits ?? []).map((benefit) => ({
    icon: benefit.icon,
    title: benefit.title,
    description: benefit.description,
  })),
  socialLinks: {
    linkedin: row?.socialLinks.linkedin ?? '',
    twitter: row?.socialLinks.twitter ?? '',
    facebook: row?.socialLinks.facebook ?? '',
    instagram: row?.socialLinks.instagram ?? '',
  },
  brandColor: row?.brandColor ?? '',
  secondaryColor: row?.secondaryColor ?? '',
  isActive: row?.isActive ?? true,
  order: row?.order ?? 0,
});

interface JobCompanyFormProps {
  initial: JobCompanyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a job company. */
export function JobCompanyForm({ initial, onDone, onCancel }: Readonly<JobCompanyFormProps>) {
  const notify = useNotify();
  const [createJobCompany] = useCreateJobCompanyMutation();
  const [updateJobCompany] = useUpdateJobCompanyMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) {
        await updateJobCompany({ variables: { id: initial.id, input: values } });
      } else {
        await createJobCompany({ variables: { input: values } });
      }
      notify(`Company ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="companyCode" label="Company code" />
          <RhfTextField name="slug" label="Slug" />
          <RhfTextField name="name" label="Name" />
          <RhfTextField name="logo" label="Logo URL" />
          <RhfTextField name="tagline" label="Tagline" />
          <RhfTextField
            name="description"
            label="Description (HTML)"
            multiline
            minRows={8}
            helperText="Raw HTML rendered on the public website"
          />
          <RhfTextField
            name="culture"
            label="Culture (HTML)"
            multiline
            minRows={8}
            helperText="Raw HTML rendered on the public website"
          />

          <Divider />
          <Typography variant="subtitle2">Company profile</Typography>
          <RhfTextField name="website" label="Website" />
          <RhfTextField name="founded" label="Founded" />
          <RhfTextField name="employees" label="Employees" />
          <RhfTextField name="industry" label="Industry" />
          <RhfTextField name="headquarters" label="Headquarters" />

          <Divider />
          <CompanyBenefitsFields />

          <Divider />
          <Typography variant="subtitle2">Social links</Typography>
          <RhfTextField name="socialLinks.linkedin" label="LinkedIn" />
          <RhfTextField name="socialLinks.twitter" label="Twitter" />
          <RhfTextField name="socialLinks.facebook" label="Facebook" />
          <RhfTextField name="socialLinks.instagram" label="Instagram" />

          <Divider />
          <Typography variant="subtitle2">Branding & visibility</Typography>
          <RhfTextField
            name="brandColor"
            label="Brand color"
            helperText="Hex value, e.g. #f9851f"
          />
          <RhfTextField name="secondaryColor" label="Secondary color" />
          <RhfTextField name="order" label="Order" type="number" />
          <RhfSwitch name="isActive" label="Active" />

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
