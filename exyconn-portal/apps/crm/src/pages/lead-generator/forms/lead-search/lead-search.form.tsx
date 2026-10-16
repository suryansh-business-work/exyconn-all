import { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import { useT } from '@exyconn/i18n';
import { Box, Button, Stack } from '@exyconn/shell/components/ui';
import { RhfSelect, RhfSwitch, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { PLACE_TYPES } from '../../leadTypes';
import {
  LEAD_SEARCH_DEFAULTS,
  leadSearchSchema,
  type LeadSearchFormInput,
  type LeadSearchValues,
} from './lead-search.types';

interface LeadSearchFormProps {
  searching: boolean;
  /** False until the map has loaded, so "around the map centre" cannot be chosen yet. */
  mapReady: boolean;
  onSearch: (values: LeadSearchValues) => void;
}

/** React Hook Form + Zod: what to look for, and where, on Google Places. */
export function LeadSearchForm({ searching, mapReady, onSearch }: Readonly<LeadSearchFormProps>) {
  const t = useT();
  const form = useForm<LeadSearchFormInput, unknown, LeadSearchValues>({
    resolver: zodResolver(leadSearchSchema),
    defaultValues: LEAD_SEARCH_DEFAULTS,
    mode: 'onTouched',
  });
  const aroundMap = form.watch('aroundMap');
  const typeOptions = useMemo(
    () => PLACE_TYPES.map((option) => ({ value: option.value, label: t(option.label) })),
    [t],
  );
  return (
    <FormProvider {...form}>
      <Box component="form" noValidate onSubmit={form.handleSubmit(onSearch)}>
        <Stack spacing={2}>
          <RhfTextField
            name="query"
            label="What to look for"
            helperText="A kind of business, e.g. dentists, coworking spaces, bakeries"
          />
          <RhfSelect name="type" label="Business type" options={typeOptions} />
          {mapReady && <RhfSwitch name="aroundMap" label="Search around the map centre" />}
          {aroundMap && mapReady ? (
            <RhfTextField
              name="radiusKm"
              label="Radius (km)"
              type="number"
              helperText="Pan and zoom the map to where you want to look"
            />
          ) : (
            <RhfTextField
              name="location"
              label="Where"
              helperText="A city, area or address, e.g. Koramangala, Bengaluru"
            />
          )}
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
