import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { Box, Button, Stack } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import type { LatLng } from '../../../../maps/mapLinks';
import { LeadSearchCentreFields } from './lead-search-centre.fields';
import { LeadSearchLocationField } from './lead-search-location.fields';
import { LeadSearchModeField } from './lead-search-mode.fields';
import {
  LEAD_SEARCH_DEFAULTS,
  leadSearchSchema,
  pointOf,
  type LeadSearchFormInput,
  type LeadSearchValues,
  type SearchCircle,
  type SearchMode,
} from './lead-search.types';

interface LeadSearchFormProps {
  searching: boolean;
  /** False until the map has loaded, so the map-based modes cannot be chosen yet. */
  mapReady: boolean;
  /** Why the map-based modes are unavailable, shown while they are. */
  mapHint: string;
  /** The finished area drawn on the map, or empty. */
  area: LatLng[];
  onModeChange: (mode: SearchMode) => void;
  /** The radius search to draw on the map, or null when the search is not around a point. */
  onCircleChange: (circle: SearchCircle | null) => void;
  onSearch: (values: LeadSearchValues) => void;
}

/** React Hook Form + Zod: what to look for, and where, on Google Places. */
export function LeadSearchForm({
  searching,
  mapReady,
  mapHint,
  area,
  onModeChange,
  onCircleChange,
  onSearch,
}: Readonly<LeadSearchFormProps>) {
  const t = useT();
  const form = useForm<LeadSearchFormInput, unknown, LeadSearchValues>({
    resolver: zodResolver(leadSearchSchema),
    defaultValues: LEAD_SEARCH_DEFAULTS,
    mode: 'onTouched',
  });
  const [mode, centre, lat, lng, radiusKm] = form.watch([
    'mode',
    'centre',
    'lat',
    'lng',
    'radiusKm',
  ]);

  useEffect(() => onModeChange(mode), [mode, onModeChange]);
  useEffect(() => {
    const km = Number(radiusKm);
    const circle = mode === 'map' ? { centre: pointOf({ centre, lat, lng }), radiusKm: km } : null;
    onCircleChange(circle);
  }, [mode, centre, lat, lng, radiusKm, onCircleChange]);
  // The map modes need a working map: fall back to a typed place when it goes away.
  useEffect(() => {
    if (!mapReady && mode !== 'place') {
      form.setValue('mode', 'place');
    }
  }, [mapReady, mode, form]);
  // The drawn area lives on the map; keep the form's copy in step for validation.
  useEffect(() => {
    form.setValue('area', area, { shouldValidate: form.formState.isSubmitted });
  }, [area, form]);

  return (
    <FormProvider {...form}>
      <Box component="form" noValidate onSubmit={form.handleSubmit(onSearch)}>
        <Stack spacing={2}>
          <RhfTextField
            name="query"
            label="What to look for"
            helperText="A kind of business, e.g. dentists, coworking spaces, bakeries"
          />
          <LeadSearchModeField mapReady={mapReady} mapHint={mapHint} />
          {mode === 'place' && <LeadSearchLocationField />}
          {mode === 'map' && <LeadSearchCentreFields />}
          <Box>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SearchIcon />}
              disabled={searching}
            >
              {searching ? t('Searching…') : t('Search Google Places')}
            </Button>
          </Box>
        </Stack>
      </Box>
    </FormProvider>
  );
}
