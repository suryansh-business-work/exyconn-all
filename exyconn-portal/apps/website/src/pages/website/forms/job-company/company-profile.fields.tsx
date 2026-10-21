import { useT } from '@exyconn/i18n';
import { Typography } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RhfMediaField } from '../../../cms/media';

const SOCIAL_HINT = 'Optional. Full profile URL starting with https://.';

/** The company's code, address, name, logo and tagline, inside the JobCompanyForm. */
export function CompanyIdentityFields({ siteId }: Readonly<{ siteId?: string }>) {
  return (
    <>
      <RhfTextField
        name="companyCode"
        label="Company code"
        helperText="Unique internal code, e.g. CMP-001."
      />
      <RhfTextField
        name="slug"
        label="Slug"
        helperText="URL segment of the careers page, e.g. exyconn."
      />
      <RhfTextField
        name="name"
        label="Name"
        helperText="The company name shown on its careers page and job posts."
      />
      <RhfMediaField
        name="logo"
        label="Logo"
        siteId={siteId}
        helperText="Optional. Shown on the careers page and next to each job post."
      />
      <RhfTextField
        name="tagline"
        label="Tagline"
        helperText="Optional. One short line under the company name."
      />
    </>
  );
}

/**
 * The company's profile facts. Reads the surrounding FormProvider
 * context, so it must render inside the JobCompanyForm.
 */
export function CompanyProfileFields() {
  const t = useT();
  return (
    <>
      <Typography variant="subtitle2">{t('Company profile')}</Typography>
      <RhfTextField
        name="website"
        label="Website"
        helperText="Optional. The company's own site, starting with https://."
      />
      <RhfTextField
        name="founded"
        label="Founded"
        helperText="Optional. Year the company was founded, e.g. 2019."
      />
      <RhfTextField
        name="employees"
        label="Employees"
        helperText="Optional. Team size as shown on the careers page, e.g. 50-100."
      />
      <RhfTextField
        name="industry"
        label="Industry"
        helperText="Optional. The sector the company works in, e.g. Software."
      />
      <RhfTextField
        name="headquarters"
        label="Headquarters"
        helperText="Optional. City and country of the main office, e.g. Bengaluru, India."
      />
    </>
  );
}

/** The company's social profile links, inside the JobCompanyForm. */
export function CompanySocialFields() {
  const t = useT();
  return (
    <>
      <Typography variant="subtitle2">{t('Social links')}</Typography>
      <RhfTextField name="socialLinks.linkedin" label="LinkedIn" helperText={SOCIAL_HINT} />
      <RhfTextField name="socialLinks.twitter" label="Twitter" helperText={SOCIAL_HINT} />
      <RhfTextField name="socialLinks.facebook" label="Facebook" helperText={SOCIAL_HINT} />
      <RhfTextField name="socialLinks.instagram" label="Instagram" helperText={SOCIAL_HINT} />
    </>
  );
}
