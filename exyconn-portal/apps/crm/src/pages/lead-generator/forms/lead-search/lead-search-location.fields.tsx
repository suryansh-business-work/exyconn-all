import type { HTMLAttributes } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Stack,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import type { LeadLocationSuggestion } from '@exyconn/shell/graphql/generated';
import type { LeadSearchFormInput } from './lead-search.types';
import { useLocationSuggestions } from './useLocationSuggestions';

type Suggestion = Pick<LeadLocationSuggestion, 'placeId' | 'text' | 'mainText' | 'secondaryText'>;

const labelOf = (option: Suggestion | string) =>
  typeof option === 'string' ? option : option.text;

/** One suggestion: the place's name, with the region it is in underneath. */
function SuggestionOption({
  optionProps,
  option,
}: Readonly<{ optionProps: HTMLAttributes<HTMLLIElement>; option: Suggestion }>) {
  return (
    <Box component="li" {...optionProps}>
      <Stack>
        <Text>{option.mainText}</Text>
        {option.secondaryText && (
          <Text size="caption" color="text.secondary">
            {option.secondaryText}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

/**
 * "Where": free text with Google's region suggestions (cities, areas, postcodes, countries)
 * as you type. Any text is still accepted, so a street address can be typed in full.
 */
export function LeadSearchLocationField() {
  const t = useT();
  const { control } = useFormContext<LeadSearchFormInput>();
  const typed = useWatch({ control, name: 'location' });
  const { suggestions, loading } = useLocationSuggestions(typed);
  return (
    <Controller
      name="location"
      control={control}
      render={({ field, fieldState }) => (
        <Autocomplete<Suggestion, false, false, true>
          freeSolo
          options={suggestions}
          filterOptions={(options) => options}
          getOptionLabel={labelOf}
          loading={loading}
          loadingText={t('Looking up places…')}
          value={field.value}
          inputValue={field.value}
          onInputChange={(_event, value) => field.onChange(value)}
          onChange={(_event, value) => field.onChange(value ? labelOf(value) : '')}
          onBlur={field.onBlur}
          renderOption={({ key: _key, ...optionProps }, option) => (
            <SuggestionOption key={option.placeId} optionProps={optionProps} option={option} />
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              name={field.name}
              inputRef={field.ref}
              label={t('Where')}
              error={Boolean(fieldState.error)}
              helperText={t(
                fieldState.error?.message ??
                  'A city, area, postcode or address, e.g. Koramangala, Bengaluru',
              )}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps.input,
                  endAdornment: (
                    <>
                      {loading && <CircularProgress size={18} aria-hidden />}
                      {params.slotProps.input.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      )}
    />
  );
}
