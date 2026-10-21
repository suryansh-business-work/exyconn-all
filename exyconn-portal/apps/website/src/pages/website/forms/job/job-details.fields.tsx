import { useT } from '@exyconn/i18n';
import { Divider, Flex, Typography } from '@exyconn/shell/components/ui';
import {
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
  RhfSwitch,
} from '@exyconn/shell/components/form/rhf';
import { useListJobCompaniesQuery } from '@exyconn/shell/graphql/generated';
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
  const t = useT();
  const { data } = useListJobCompaniesQuery();
  const companyOptions = (data?.listJobCompanies ?? []).map((company) => ({
    label: company.name,
    value: company.slug,
  }));

  return (
    <Flex direction="column" spacing={2}>
      <RhfTextField
        name="jobCode"
        label="Job code"
        helperText="Unique internal code, e.g. JOB-001."
      />
      <RhfSelect
        name="companySlug"
        label="Company"
        options={companyOptions}
        helperText="Companies come from the Job Companies module"
      />
      <RhfTextField
        name="title"
        label="Title"
        helperText="The role name candidates see, e.g. Senior Frontend Engineer."
      />
      <RhfSelect
        name="category"
        label="Category"
        options={toOptions(JOB_CATEGORIES)}
        helperText="The team or function the job is listed under."
      />

      <Divider />
      <Typography variant="subtitle2">{t('Placement')}</Typography>
      <RhfTextField
        name="location"
        label="Location"
        helperText="Optional. City and country, e.g. Bengaluru, India."
      />
      <RhfSelect
        name="jobType"
        label="Job type"
        options={toOptions(JOB_TYPES)}
        helperText="The employment arrangement for this role."
      />
      <RhfSelect
        name="experienceLevel"
        label="Experience level"
        options={toOptions(EXPERIENCE_LEVELS)}
        helperText="The seniority the role is hiring for."
      />
      <RhfSelect
        name="workMode"
        label="Work mode"
        options={toOptions(WORK_MODES)}
        helperText="Where the work happens: remote, on-site or hybrid."
      />
      <RhfTextField
        name="salaryRange"
        label="Salary range"
        helperText="Optional. Shown as written, e.g. ₹12-18 LPA."
      />
      <RhfDatePicker
        name="jobPostDate"
        label="Job post date"
        helperText="Optional. The date the job is shown as posted."
      />
      <RhfDatePicker
        name="applicationDeadline"
        label="Application deadline"
        helperText="Optional. Last day to apply; leave empty for an open-ended role."
      />

      <Divider />
      <Typography variant="subtitle2">{t('Visibility')}</Typography>
      <RhfSwitch name="isActive" label="Active" />
      <RhfSwitch name="isFeatured" label="Featured" />
    </Flex>
  );
}
