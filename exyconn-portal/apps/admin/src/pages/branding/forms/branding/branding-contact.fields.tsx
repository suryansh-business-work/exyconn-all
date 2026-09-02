import { Grid } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

const CONTACT_FIELDS = [
  { name: 'supportEmail', label: 'Support email' },
  { name: 'contactPhone', label: 'Contact phone' },
  { name: 'websiteUrl', label: 'Website URL' },
  { name: 'address', label: 'Address' },
] as const;

const SOCIAL_FIELDS = [
  { name: 'linkedinUrl', label: 'LinkedIn' },
  { name: 'twitterUrl', label: 'X / Twitter' },
  { name: 'facebookUrl', label: 'Facebook' },
  { name: 'instagramUrl', label: 'Instagram' },
  { name: 'youtubeUrl', label: 'YouTube' },
  { name: 'githubUrl', label: 'GitHub' },
] as const;

/** Contact & social tab — public contact details, social profiles and copyright. */
export function BrandingContactFields() {
  return (
    <Grid container spacing={2.5}>
      {CONTACT_FIELDS.map((field) => (
        <Grid item xs={12} sm={6} key={field.name}>
          <RhfTextField name={field.name} label={field.label} />
        </Grid>
      ))}
      {SOCIAL_FIELDS.map((field) => (
        <Grid item xs={12} sm={6} key={field.name}>
          <RhfTextField name={field.name} label={field.label} helperText="Full profile URL" />
        </Grid>
      ))}
      <Grid item xs={12}>
        <RhfTextField
          name="copyrightText"
          label="Copyright text"
          helperText="Shown in the website and email footers."
        />
      </Grid>
    </Grid>
  );
}
