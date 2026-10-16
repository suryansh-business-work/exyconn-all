import { useT } from '@exyconn/i18n';
import { Box, Flex, InputAdornment, Text } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';

interface RuleFieldProps {
  name: 'bufferMinutes' | 'minNoticeHours' | 'maxDaysAhead';
  label: string;
  unit: string;
  hint: string;
}

/** A whole number with its unit written after it, so the label can stay short. */
function RuleField({ name, label, unit, hint }: Readonly<RuleFieldProps>) {
  const t = useT();
  return (
    <RhfTextField
      name={name}
      label={label}
      helperText={hint}
      inputMode="numeric"
      slotProps={{
        input: { endAdornment: <InputAdornment position="end">{t(unit)}</InputAdornment> },
      }}
    />
  );
}

/** How close together, how soon and how far ahead a meeting may be booked. */
export function BookingRulesFields() {
  const t = useT();
  return (
    <Flex direction="column" spacing={1.5}>
      <Text component="h3" size="label" weight="bold">
        {t('Booking rules')}
      </Text>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <RuleField
          name="bufferMinutes"
          label="Buffer"
          unit="min"
          hint="Kept free after each meeting"
        />
        <RuleField
          name="minNoticeHours"
          label="Minimum notice"
          unit="hours"
          hint="How soon before the start a slot can be booked"
        />
        <RuleField
          name="maxDaysAhead"
          label="Booking window"
          unit="days"
          hint="How far ahead people can book"
        />
      </Box>
    </Flex>
  );
}
