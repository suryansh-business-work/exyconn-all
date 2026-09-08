import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Box, Text } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useMemo } from 'react';
import { endonymOf, isValidLocale, timezoneOptions } from '@exyconn/i18n';
import {
  RhfAutocomplete,
  RhfChipsInput,
  RhfSelect,
  RhfSwitch,
} from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { AppSettingsDocument, useUpdateSettingsMutation } from '@exyconn/shell/graphql/generated';
import {
  DATE_FORMATS,
  TIME_FORMATS,
  appSettingsSchema,
  isTimezone,
  toAppSettingsValues,
  type AppSettingsFormValues,
  type AppSettingsRow,
} from './app-settings.types';

/** Each pattern is labelled with "now" rendered through it, so the choice reads as a date. */
const patternOptions = (patterns: readonly string[]) =>
  patterns.map((value) => ({ value, label: `${value}  —  ${format(new Date(), value)}` }));

const DATE_FORMAT_OPTIONS = patternOptions(DATE_FORMATS);
const TIME_FORMAT_OPTIONS = patternOptions(TIME_FORMATS);
// Labelled with each zone's current offset, so "Asia/Kolkata" reads as a time as well
// as a place. Built once: the list is ~450 entries.
const TIMEZONE_OPTIONS = timezoneOptions();

/**
 * The languages the default can be set to: the ones this workspace offers, plus English.
 *
 * Derived from the field below rather than from a master list of every language on earth —
 * you cannot default to a language you do not offer, and a hardcoded menu is exactly the
 * thing that would stop the portal running in somebody's country.
 */
function DefaultLanguageField() {
  const { control } = useFormContext<AppSettingsFormValues>();
  const enabled = useWatch({ control, name: 'enabledLocales' });
  const options = useMemo(() => {
    const tags = new Set(['en', ...(enabled ?? []).filter(isValidLocale)]);
    return [...tags]
      .map((tag) => ({ value: tag, label: `${endonymOf(tag)} (${tag})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [enabled]);

  return (
    <RhfSelect
      name="defaultLocale"
      label="Default language"
      options={options}
      helperText="The language the portal is shown in to anybody who has not picked one — and the language an untranslated string falls back to."
    />
  );
}

/** "Now" through the values currently in the form, so an edit is visible before it is saved. */
function AppSettingsPreview() {
  const { control } = useFormContext<AppSettingsFormValues>();
  const [dateFormat, timeFormat, timezone] = useWatch({
    control,
    name: ['dateFormat', 'timeFormat', 'timezone'],
  });
  const complete = Boolean(dateFormat && timeFormat) && isTimezone(timezone);
  const sample = complete
    ? formatInTimeZone(new Date(), timezone, `${dateFormat} ${timeFormat}`)
    : 'Pick a date format, a time format and a timezone';

  return (
    <Box
      sx={(t) => ({
        p: 2,
        borderRadius: 1,
        border: `1px dashed ${t.palette.divider}`,
        background: t.palette.action.hover,
      })}
    >
      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
        Right now, as every portal will show it
      </Text>
      <Text weight="medium" data-testid="app-settings-preview">
        {sample}
      </Text>
    </Box>
  );
}

interface AppSettingsFormProps {
  initial: AppSettingsRow;
}

/**
 * React Hook Form + Zod form for the portal-wide date, time and timezone settings.
 * Saving refetches `AppSettings`, which is what `useSettings` reads in every app.
 */
export function AppSettingsForm({ initial }: Readonly<AppSettingsFormProps>) {
  const notify = useNotify();
  const [updateSettings] = useUpdateSettingsMutation({ refetchQueries: [AppSettingsDocument] });
  const methods = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: toAppSettingsValues(initial),
  });

  const onSubmit = async (values: AppSettingsFormValues) => {
    try {
      await updateSettings({ variables: { input: values } });
      methods.reset(values);
      notify('App settings updated');
    } catch (err) {
      notify(errorMessage(err, 'Save failed'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      submitLabel="Save changes"
      onCancel={() => methods.reset(toAppSettingsValues(initial))}
    >
      <AppSettingsPreview />
      <RhfSelect
        name="dateFormat"
        label="Date format"
        options={DATE_FORMAT_OPTIONS}
        helperText="How dates appear in grids, forms and emails."
      />
      <RhfSelect
        name="timeFormat"
        label="Time format"
        options={TIME_FORMAT_OPTIONS}
        helperText="12-hour with am/pm, or 24-hour."
      />
      <RhfAutocomplete
        name="timezone"
        label="Timezone"
        options={TIMEZONE_OPTIONS}
        helperText="IANA zone the organisation keeps time in. Everybody who has not picked their own reads dates in this one."
      />
      <RhfChipsInput
        name="enabledLocales"
        label="Languages offered"
        helperText="BCP-47 tags people may choose from, e.g. hi, ar, pt-BR. Type one and press Enter. English is always available."
      />
      <DefaultLanguageField />
      {/* The first time a screen shows text a language has no translation for, it is
          translated and stored. Off leaves it in the default language until somebody
          writes the translation by hand in Localization. */}
      <RhfSwitch name="autoTranslate" label="Translate new text automatically" />
    </EntityForm>
  );
}
