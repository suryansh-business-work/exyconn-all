import { useT } from '@exyconn/i18n';
import { Divider, Flex, Typography } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfChipsInput, RhfRichText } from '@exyconn/shell/components/form/rhf';
import { MEDIA_FOLDERS } from '../../live-edit/live-edit.config';

const PAGE_HINT = 'Shown on the job page of the public website';

/**
 * The long-form copy and open-ended list fields of a job. Reads the surrounding
 * FormProvider context, so it must render inside the JobForm.
 */
export function JobContentFields() {
  const t = useT();
  return (
    <Flex direction="column" spacing={2}>
      <RhfChipsInput
        name="skillSet"
        label="Skill set"
        helperText="Optional. Key skills shown on the job page. Type one and press Enter."
      />
      <RhfTextField
        name="shortJobDescription"
        label="Short job description"
        multiline
        minRows={3}
        helperText="Optional. A two or three sentence teaser shown in the job list."
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
      <Typography variant="subtitle2">{t('Candidate profile')}</Typography>
      <RhfChipsInput
        name="requirements"
        label="Requirements"
        helperText="Optional. Must-have qualifications, one per entry."
      />
      <RhfChipsInput
        name="niceToHave"
        label="Nice to have"
        helperText="Optional. Skills that help but are not required, one per entry."
      />
      <RhfChipsInput
        name="benefits"
        label="Benefits"
        helperText="Optional. Perks of this role, one per entry."
      />
    </Flex>
  );
}
