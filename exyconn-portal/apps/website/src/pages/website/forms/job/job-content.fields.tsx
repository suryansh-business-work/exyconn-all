import { Divider, Flex, Typography } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfChipsInput, RhfRichText } from '@exyconn/shell/components/form/rhf';
import { MEDIA_FOLDERS } from '../../live-edit/live-edit.config';

const PAGE_HINT = 'Shown on the job page of the public website';

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
      <RhfRichText
        name="jobDescription"
        label="Job description"
        folder={MEDIA_FOLDERS.careers}
        helperText={PAGE_HINT}
      />
      <RhfRichText
        name="jobResponsibilities"
        label="Job responsibilities"
        folder={MEDIA_FOLDERS.careers}
        helperText={PAGE_HINT}
      />

      <Divider />
      <Typography variant="subtitle2">Candidate profile</Typography>
      <RhfChipsInput name="requirements" label="Requirements" />
      <RhfChipsInput name="niceToHave" label="Nice to have" />
      <RhfChipsInput name="benefits" label="Benefits" />
    </Flex>
  );
}
