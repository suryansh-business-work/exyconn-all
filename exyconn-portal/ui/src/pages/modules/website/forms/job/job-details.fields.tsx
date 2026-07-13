import { Divider, Flex, Typography } from '@/components/ui';
import { RhfTextField, RhfSelect, RhfDatePicker, RhfSwitch } from '@/components/form/rhf';
import { useListJobCompaniesQuery } from '@/graphql/generated';
import {
  JOB_CATEGORIES,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  WORK_MODES,
  toOptions,
} from '../../website.constants';

/**
 * Identity, classification and scheduling fields of a job. The company select is
 * populated from `listJobCompanies` rather than a hard-coded list. Reads the
 * surrounding FormProvider context, so it must render inside the JobForm.
 */
export function JobDetailsFields() {
  const { data } = useListJobCompaniesQuery();
  const companyOptions = (data?.listJobCompanies ?? []).map((company) => ({
    label: company.name,
    value: company.slug,
  }));

  return (
    <Flex direction="column" spacing={2.5}>
      <RhfTextField name="jobCode" label="Job code" />
      <RhfSelect
        name="companySlug"
        label="Company"
        options={companyOptions}
        helperText="Companies come from the Job Companies module"
      />
      <RhfTextField name="title" label="Title" />
      <RhfSelect name="category" label="Category" options={toOptions(JOB_CATEGORIES)} />

      <Divider />
      <Typography variant="subtitle2">Placement</Typography>
      <RhfTextField name="location" label="Location" />
      <RhfSelect name="jobType" label="Job type" options={toOptions(JOB_TYPES)} />
      <RhfSelect
        name="experienceLevel"
        label="Experience level"
        options={toOptions(EXPERIENCE_LEVELS)}
      />
      <RhfSelect name="workMode" label="Work mode" options={toOptions(WORK_MODES)} />
      <RhfTextField name="salaryRange" label="Salary range" />
      <RhfDatePicker name="jobPostDate" label="Job post date" />
      <RhfDatePicker name="applicationDeadline" label="Application deadline" />

      <Divider />
      <Typography variant="subtitle2">Visibility</Typography>
      <RhfSwitch name="isActive" label="Active" />
      <RhfSwitch name="isFeatured" label="Featured" />
    </Flex>
  );
}
