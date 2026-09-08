import { useFormContext } from 'react-hook-form';
import { RhfAutocomplete, RhfSelect } from '@/components/form/rhf';
import { useLanguageOptions, useTimezoneOptions } from './localeOptions';

interface Props {
  /** Field names, so this works on both the employee record and a person's own profile. */
  timezoneName?: string;
  localeName?: string;
}

/**
 * Where somebody is and what language they read.
 *
 * Shared by HR's employee form and the person's own profile on purpose: the two must offer
 * the same choices and store the same thing, or an employee "correcting" their timezone
 * would be writing a different kind of value than the one HR set.
 *
 * Leaving either empty means "follow the workspace default", and keeps following it when an
 * admin moves that default.
 */
export function LocalePreferenceFields({
  timezoneName = 'timezone',
  localeName = 'locale',
}: Readonly<Props>) {
  const { watch } = useFormContext();
  const timezones = useTimezoneOptions(String(watch(timezoneName) ?? ''));
  const languages = useLanguageOptions();

  return (
    <>
      <RhfAutocomplete
        name={timezoneName}
        label="Timezone"
        options={timezones}
        helperText="Every date and time is shown in this zone. Leave it on the workspace default to follow the house setting."
      />
      <RhfSelect
        name={localeName}
        label="Language"
        options={languages}
        helperText="The language the portal is shown in. Anything not yet translated stays in the workspace's own language."
      />
    </>
  );
}
