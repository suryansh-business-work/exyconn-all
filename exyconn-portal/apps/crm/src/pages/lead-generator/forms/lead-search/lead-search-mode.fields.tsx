import { useId } from 'react';
import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import {
  FormHelperText,
  FormLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@exyconn/shell/components/ui';
import type { LeadSearchFormInput, SearchMode } from './lead-search.types';

/** The three ways to say where; the English label is the translation key. */
const MODES: ReadonlyArray<{ value: SearchMode; label: string; needsMap: boolean }> = [
  { value: 'place', label: 'A place', needsMap: false },
  { value: 'map', label: 'Around the map centre', needsMap: true },
  { value: 'area', label: 'Inside a drawn area', needsMap: true },
];

interface ModeFieldProps {
  mapReady: boolean;
  /** Why the map modes are unavailable, shown while they are. */
  mapHint: string;
}

/** Where to search: a typed place, a radius around the map's centre, or an area drawn on it. */
export function LeadSearchModeField({ mapReady, mapHint }: Readonly<ModeFieldProps>) {
  const t = useT();
  const labelId = useId();
  const { control } = useFormContext<LeadSearchFormInput>();
  // The Controller below only re-renders for "mode"; the area's error needs its own subscription.
  const { errors } = useFormState({ control, name: 'area' });
  return (
    <Controller
      name="mode"
      control={control}
      render={({ field }) => {
        const areaError = field.value === 'area' ? errors.area?.message : undefined;
        let hint = mapReady ? '' : mapHint;
        if (field.value === 'area') {
          hint = t(
            'Use Draw area by the map, then click the map to mark the corners. Drawing needs a mouse, pen or touch.',
          );
        }
        return (
          <Stack spacing={0.5}>
            <FormLabel id={labelId}>{t('Search in')}</FormLabel>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              aria-labelledby={labelId}
              value={field.value}
              onChange={(_event, value: SearchMode | null) => value && field.onChange(value)}
            >
              {MODES.map((mode) => (
                <ToggleButton
                  key={mode.value}
                  value={mode.value}
                  disabled={mode.needsMap && !mapReady}
                >
                  {t(mode.label)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {areaError && <FormHelperText error>{t(areaError)}</FormHelperText>}
            {hint && <FormHelperText>{hint}</FormHelperText>}
          </Stack>
        );
      }}
    />
  );
}
