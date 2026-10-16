import { useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Flex, Text } from '@exyconn/shell/components/ui';
import { RhfFieldArrayError, RhfSwitch, RhfTimePicker } from '@exyconn/shell/components/form/rhf';
import { WEEK } from './meeting-type.types';

/** One weekday: available or not, and from when to when. */
function DayRow({ index, label }: Readonly<{ index: number; label: string }>) {
  const enabled = useWatch({ name: `weeklyHours.${index}.enabled` }) === true;
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      <RhfSwitch name={`weeklyHours.${index}.enabled`} label={label} />
      {enabled && (
        <>
          <RhfTimePicker name={`weeklyHours.${index}.start`} label="From" />
          <RhfTimePicker name={`weeklyHours.${index}.end`} label="To" />
        </>
      )}
    </Flex>
  );
}

/** When the host can be booked, in the meeting type's time zone. */
export function WeeklyHoursFields() {
  const t = useT();
  return (
    <Flex direction="column" spacing={1}>
      <Text component="h3" size="label" weight="bold">
        {t('Availability')}
      </Text>
      {WEEK.map(({ day, label }, index) => (
        <DayRow key={day} index={index} label={label} />
      ))}
      <RhfFieldArrayError name="weeklyHours" />
    </Flex>
  );
}
