import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { timezoneOptions, useT } from '@exyconn/i18n';
import { Grid, Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfSwitch, RhfTimePicker } from '@exyconn/shell/components/form/rhf';
import { WEEKDAYS, type ChatSettingsFormInput } from './chat-settings.types';
import { SettingsSection } from './SettingsSection';

/** One weekday: open or closed, and the hours the team answers. */
function DayRow({ index }: Readonly<{ index: number }>) {
  const t = useT();
  const { control } = useFormContext<ChatSettingsFormInput>();
  const enabled = useWatch({ control, name: `weeklyHours.${index}.enabled` });

  return (
    <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Text weight="medium">{t(WEEKDAYS[index])}</Text>
      </Grid>
      <Grid size={{ xs: 12, sm: 3 }}>
        <RhfSwitch name={`weeklyHours.${index}.enabled`} label={enabled ? 'Open' : 'Closed'} />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <RhfTimePicker name={`weeklyHours.${index}.start`} label="Opens" />
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <RhfTimePicker name={`weeklyHours.${index}.end`} label="Closes" />
      </Grid>
    </Grid>
  );
}

/** The timezone and the weekly hours the team is on duty; outside them the bot answers. */
export function ChatHoursFields({ savedTimezone }: Readonly<{ savedTimezone: string }>) {
  // The saved zone is unioned in, so an alias Intl does not list still shows (see App Settings).
  const timezones = useMemo(() => timezoneOptions(savedTimezone), [savedTimezone]);

  return (
    <SettingsSection
      title="Opening hours"
      description="When the team answers live. Outside these hours the widget shows the offline message and the Knowledge Bot answers."
    >
      <RhfAutocomplete
        name="timezone"
        label="Timezone"
        options={timezones}
        helperText="The opening hours below are in this zone."
      />
      {WEEKDAYS.map((day, index) => (
        <DayRow key={day} index={index} />
      ))}
    </SettingsSection>
  );
}
