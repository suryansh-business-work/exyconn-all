import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { countryOptions, timezoneOptions, useI18n, useT } from '@exyconn/i18n';
import { Divider, Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfTextField } from '@exyconn/shell/components/form/rhf';

/** A contact's or company's web presence and whereabouts (see profile.schema.ts). */
export function ProfileFields({ aboutLabel }: Readonly<{ aboutLabel: string }>) {
  const t = useT();
  const savedZone = useWatch({ name: 'timezone' }) as string;
  const zones = useMemo(() => timezoneOptions(savedZone), [savedZone]);
  const { locale } = useI18n();
  const countries = useMemo(
    () => countryOptions(locale).map(({ code, label }) => ({ value: code, label })),
    [locale],
  );
  return (
    <>
      <Divider />
      <Text component="h3" size="label" weight="bold">
        {t('Online')}
      </Text>
      <RhfTextField name="website" label="Website" placeholder="https://" />
      <RhfTextField name="linkedinUrl" label="LinkedIn" placeholder="https://linkedin.com/in/…" />
      <RhfTextField name="twitterUrl" label="X (Twitter)" placeholder="https://x.com/…" />
      <Divider />
      <Text component="h3" size="label" weight="bold">
        {t('Location')}
      </Text>
      <RhfTextField name="address" label="Address" multiline minRows={2} />
      <RhfTextField name="city" label="City" />
      <RhfAutocomplete name="country" label="Country" options={countries} />
      <RhfAutocomplete
        name="timezone"
        label="Time zone"
        options={zones}
        helperText="Shows their local time on the profile"
      />
      <RhfTextField name="description" label={aboutLabel} multiline minRows={3} />
    </>
  );
}
