import { useId, type ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Chip, Flex, FormHelperText, Text } from '@/components/ui';
import { WEEK_DAYS, inWeekOrder, useWeekdayName } from '@/components/work/work-days';
import { useFieldCopy } from './useFieldCopy';
import { useFieldMeta } from './useFieldMeta';
import { RequiredStar } from './RequiredStar';

interface RhfWorkDaysProps {
  /** A `number[]` field of weekdays, 0 (Sunday) to 6 (Saturday). */
  name: string;
  label: string;
  helperText?: ReactNode;
  /** Marks the label with the required star; by default the schema decides. */
  required?: boolean;
}

/**
 * The days of a working week as chips that toggle on and off, Monday first, named in the
 * person's language. Each chip is a toggle button (`aria-pressed`), so a screen reader says
 * which days are on without relying on the colour.
 */
export function RhfWorkDays({ name, label, helperText, required }: Readonly<RhfWorkDaysProps>) {
  const { control } = useFormContext();
  const meta = useFieldMeta<ReactNode>(name, { required, helperText });
  const copy = useFieldCopy();
  const dayName = useWeekdayName('long');
  const labelId = useId();
  const hintId = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = new Set<number>((field.value as number[] | undefined) ?? []);
        const toggle = (day: number) => {
          const next = selected.has(day)
            ? [...selected].filter((value) => value !== day)
            : [...selected, day];
          field.onChange(inWeekOrder(next));
        };
        const hint = fieldState.error?.message ? copy(fieldState.error.message) : meta.helperText;
        return (
          <Box role="group" aria-labelledby={labelId} aria-describedby={hint ? hintId : undefined}>
            <Text id={labelId} size="sm" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {copy(label)}
              <RequiredStar show={meta.required} />
            </Text>
            <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {WEEK_DAYS.map((day) => {
                const on = selected.has(day);
                return (
                  <Chip
                    key={day}
                    label={dayName(day)}
                    color={on ? 'primary' : 'default'}
                    variant={on ? 'filled' : 'outlined'}
                    aria-pressed={on}
                    onClick={() => toggle(day)}
                    onBlur={field.onBlur}
                  />
                );
              })}
            </Flex>
            {hint && (
              <FormHelperText id={hintId} error={Boolean(fieldState.error)}>
                {hint}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
}
