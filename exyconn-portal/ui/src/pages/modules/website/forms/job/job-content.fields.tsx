import { Divider, Flex, Typography } from '@/components/ui';
import { RhfTextField, RhfChipsInput } from '@/components/form/rhf';

const HTML_HINT = 'Raw HTML rendered on the public website';

/**
 * The long-form copy and open-ended list fields of a job. Reads the surrounding
 * FormProvider context, so it must render inside the JobForm.
 */
export function JobContentFields() {
  return (
    <Flex direction="column" spacing={2.5}>
      <RhfChipsInput name="skillSet" label="Skill set" />
      <RhfTextField
        name="shortJobDescription"
        label="Short job description"
        multiline
        minRows={3}
      />
      <RhfTextField
        name="jobDescription"
        label="Job description (HTML)"
        multiline
        minRows={8}
        helperText={HTML_HINT}
      />
      <RhfTextField
        name="jobResponsibilities"
        label="Job responsibilities (HTML)"
        multiline
        minRows={8}
        helperText={HTML_HINT}
      />

      <Divider />
      <Typography variant="subtitle2">Candidate profile</Typography>
      <RhfChipsInput name="requirements" label="Requirements" />
      <RhfChipsInput name="niceToHave" label="Nice to have" />
      <RhfChipsInput name="benefits" label="Benefits" />
    </Flex>
  );
}
