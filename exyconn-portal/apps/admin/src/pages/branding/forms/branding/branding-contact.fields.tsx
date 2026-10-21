import { Grid } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

const CONTACT_FIELDS = [
  {
    name: 'supportEmail',
    label: 'Support email',
    hint: 'Optional. Shown on sign-in pages, the trackers and the website for help requests.',
  },
  {
    name: 'hrEmail',
    label: 'HR email',
    hint: 'Optional. Printed on payslips as the address for pay questions.',
  },
  {
    name: 'contactPhone',
    label: 'Contact phone',
    hint: 'Optional. The public phone number shown on the website, e.g. +91 98765 43210.',
  },
  {
    name: 'websiteUrl',
    label: 'Website URL',
    hint: 'Optional. The full company website address, e.g. https://example.com.',
  },
  { name: 'address', label: 'Address', hint: 'Optional. The postal address shown in footers.' },
] as const;

const SOCIAL_FIELDS = [
  { name: 'linkedinUrl', label: 'LinkedIn' },
  { name: 'twitterUrl', label: 'X / Twitter' },
  { name: 'facebookUrl', label: 'Facebook' },
  { name: 'instagramUrl', label: 'Instagram' },
  { name: 'youtubeUrl', label: 'YouTube' },
  { name: 'githubUrl', label: 'GitHub' },
  { name: 'clutchUrl', label: 'Clutch' },
  { name: 'crunchbaseUrl', label: 'Crunchbase' },
  { name: 'ambitionboxUrl', label: 'AmbitionBox' },
] as const;

/** Contact & social tab — public contact details, social profiles and copyright. */
export function BrandingContactFields() {
  return (
    <Grid container spacing={2}>
      {CONTACT_FIELDS.map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <RhfTextField name={field.name} label={field.label} helperText={field.hint} />
        </Grid>
      ))}
      {SOCIAL_FIELDS.map((field) => (
        <Grid
          key={field.name}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <RhfTextField name={field.name} label={field.label} helperText="Full profile URL" />
        </Grid>
      ))}
      <Grid size={12}>
        <RhfTextField
          name="copyrightText"
          label="Copyright text"
          helperText="Shown in the website and email footers."
        />
      </Grid>
    </Grid>
  );
}
