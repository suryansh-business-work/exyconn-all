import { useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text, type SxProps, type Theme } from '@exyconn/shell/components/ui';
import { RhfFieldArrayError, RhfSwitch, RhfTimePicker } from '@exyconn/shell/components/form/rhf';
import { WEEK } from './meeting-type.types';

/** The height of a small text field, so an available and an unavailable day line up. */
const ROW_HEIGHT = 5;

/**
 * One grid for the whole week: a fixed day column, then From and To. On a phone the day sits
 * on its own line with From and To side by side under it.
 */
const rowSx: SxProps<Theme> = (theme) => ({
  display: 'grid',
  gridTemplateColumns: { xs: '1fr 1fr', sm: `${theme.spacing(20)} 1fr 1fr` },
  columnGap: theme.spacing(1.5),
  rowGap: theme.spacing(0.5),
  alignItems: 'start',
});

const dayCellSx: SxProps<Theme> = {
  gridColumn: { xs: '1 / -1', sm: 'auto' },
  minHeight: (theme) => theme.spacing(ROW_HEIGHT),
  display: 'flex',
  alignItems: 'center',
};

const unavailableSx: SxProps<Theme> = {
  gridColumn: 'span 2',
  minHeight: (theme) => theme.spacing(ROW_HEIGHT),
  display: 'flex',
  alignItems: 'center',
  px: 1.5,
  border: 1,
  borderStyle: 'dashed',
  borderColor: 'divider',
  borderRadius: 1,
  bgcolor: 'action.hover',
};

/** One weekday: available or not, and from when to when. */
function DayRow({ index, label }: Readonly<{ index: number; label: string }>) {
  const t = useT();
  const enabled = useWatch({ name: `weeklyHours.${index}.enabled` }) === true;
  return (
    <Box role="group" aria-label={t(label)} sx={rowSx} data-cy={`weekly-hours-${index}`}>
      <Box sx={dayCellSx}>
        <RhfSwitch name={`weeklyHours.${index}.enabled`} label={label} />
      </Box>
      {enabled ? (
        <>
          <RhfTimePicker name={`weeklyHours.${index}.start`} label="From" size="small" />
          <RhfTimePicker name={`weeklyHours.${index}.end`} label="To" size="small" />
        </>
      ) : (
        <Box sx={unavailableSx}>
          <Text size="sm" color="text.secondary">
            {t('Unavailable')}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/** When the host can be booked, in the meeting type's time zone. */
export function WeeklyHoursFields() {
  const t = useT();
  return (
    <Flex direction="column" spacing={1.5}>
      <Flex direction="column" spacing={0.5}>
        <Text component="h3" size="label" weight="bold">
          {t('Availability')}
        </Text>
        <Text size="caption" color="text.secondary">
          {t('Turn on the days people can book, and the hours on each, in the time zone above.')}
        </Text>
      </Flex>
      {WEEK.map(({ day, label }, index) => (
        <DayRow key={day} index={index} label={label} />
      ))}
      <RhfFieldArrayError name="weeklyHours" />
    </Flex>
  );
}
