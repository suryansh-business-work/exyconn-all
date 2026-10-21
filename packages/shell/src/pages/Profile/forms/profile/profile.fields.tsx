import { useT } from '@exyconn/i18n';
import { InputAdornment, Text, TextField } from '@/components/ui';
import { RhfSelect, RhfTextField } from '@/components/form/rhf';
import {
  LocalePreferenceFields,
  useDateFormatOptions,
  useTimeFormatOptions,
} from '@/components/localization';
import { SOCIAL_NETWORKS } from '@/components/profile/SocialLinkButtons';
import { BRIEF_MAX_LENGTH } from './profile.schema';

/** A small heading that splits the form into what it is about. */
function SectionTitle({ children }: Readonly<{ children: string }>) {
  const t = useT();
  return (
    <Text size="overline" color="text.secondary" sx={{ display: 'block' }}>
      {t(children)}
    </Text>
  );
}

/**
 * Name, the address you sign in with, phone and bio. The email is locked (disabled and
 * read-only): only an administrator changes how somebody signs in.
 */
export function AboutFields({ email }: Readonly<{ email: string }>) {
  const t = useT();
  return (
    <>
      <SectionTitle>About you</SectionTitle>
      <RhfTextField
        name="name"
        label="Full name"
        autoComplete="name"
        helperText="How your name appears to colleagues across the portals."
      />
      <TextField
        label={t('Email')}
        value={email}
        disabled
        fullWidth
        slotProps={{ htmlInput: { readOnly: true } }}
      />
      <RhfTextField
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        helperText="Include the country code, e.g. +91 98765 43210."
      />
      <RhfTextField
        name="brief"
        label="Bio"
        multiline
        minRows={3}
        helperText={`A few lines colleagues see on your profile (up to ${BRIEF_MAX_LENGTH} characters).`}
      />
    </>
  );
}

/** One optional web address per network the profile can link to. */
export function SocialLinkFields() {
  return (
    <>
      <SectionTitle>Social profiles</SectionTitle>
      {SOCIAL_NETWORKS.map(({ key, label, icon: Icon }) => (
        <RhfTextField
          key={key}
          name={`socialLinks.${key}`}
          label={label}
          type="url"
          placeholder="https://"
          helperText="Optional. The full link to your profile, starting with https://."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      ))}
    </>
  );
}

/** Where the person is and what language they read. */
export function PreferenceFields() {
  const dateFormats = useDateFormatOptions();
  const timeFormats = useTimeFormatOptions();
  return (
    <>
      <SectionTitle>Preferences</SectionTitle>
      <LocalePreferenceFields />
      <RhfSelect
        name="dateFormat"
        label="Date format"
        options={dateFormats}
        helperText="How dates read for you in every table, card and form. Leave it on the workspace default to follow Admin › Settings."
      />
      <RhfSelect
        name="timeFormat"
        label="Time format"
        options={timeFormats}
        helperText="12-hour with am/pm, or 24-hour. Leave it on the workspace default to follow Admin › Settings."
      />
    </>
  );
}
