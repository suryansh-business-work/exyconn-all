import { useId, type ReactNode } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useFieldCopy } from './useFieldCopy';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Text,
} from '@/components/ui';

/** A choice with the sentence that explains it, shown under its label. */
export interface RadioChoice {
  value: string;
  label: string;
  description?: string;
  /** Marks the option the product recommends; shown beside its label. */
  recommended?: boolean;
}

interface RhfRadioGroupProps {
  name: string;
  label: string;
  options: readonly RadioChoice[];
  helperText?: ReactNode;
  /** Shown under the group whatever is chosen — an example, a warning. */
  children?: ReactNode;
}

/**
 * React Hook Form-bound radio group whose options each carry their own hint, for choices
 * whose consequences need a sentence (how an audience updates, which addresses it uses).
 */
export function RhfRadioGroup({
  name,
  label,
  options,
  helperText,
  children,
}: Readonly<RhfRadioGroupProps>) {
  const { control } = useFormContext();
  const copy = useFieldCopy();
  const labelId = useId();
  const hintId = useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FormControl error={Boolean(fieldState.error)}>
          <FormLabel id={labelId}>{copy(label)}</FormLabel>
          <RadioGroup
            {...field}
            aria-labelledby={labelId}
            aria-describedby={hintId}
            value={field.value ?? ''}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                sx={{ alignItems: 'flex-start', mt: 1 }}
                label={
                  <Box sx={{ pt: 1 }}>
                    <Text size="sm" weight="medium" sx={{ display: 'block' }}>
                      {copy(option.label)}
                      {option.recommended && (
                        <Text size="caption" color="primary.main" sx={{ ml: 1 }}>
                          {copy('Recommended')}
                        </Text>
                      )}
                    </Text>
                    {option.description && (
                      <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {copy(option.description)}
                      </Text>
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
          <FormHelperText id={hintId} role={fieldState.error ? 'alert' : undefined}>
            {copy(fieldState.error?.message ?? helperText)}
          </FormHelperText>
          {children}
        </FormControl>
      )}
    />
  );
}
