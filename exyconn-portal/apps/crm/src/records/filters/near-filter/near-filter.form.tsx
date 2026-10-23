import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import { RADIUS_KM_OPTIONS } from '../../../maps/radius';
import { NearMeButton } from './NearMeButton';
import { NearPlaceField } from './NearPlaceField';
import {
  nearFilterSchema,
  toNearFilter,
  toNearFormValues,
  type NamedCentre,
  type NearFilter,
  type NearFilterFormInput,
  type NearFilterValues,
} from './near-filter.types';

interface NearFilterFormProps {
  /** The filter in place, if any; the form starts from it. */
  near: NearFilter | null;
  onApply: (near: NearFilter) => void;
  /** Takes the filter off the list. */
  onClear: () => void;
  onCancel: () => void;
}

/**
 * "Near a location" (React Hook Form + Zod): a centre from the browser, a Google place or typed
 * coordinates, and a radius. The list then shows only records within that many kilometres.
 */
export function NearFilterForm({
  near,
  onApply,
  onClear,
  onCancel,
}: Readonly<NearFilterFormProps>) {
  const t = useT();
  const methods = useForm<NearFilterFormInput, unknown, NearFilterValues>({
    mode: 'onTouched',
    resolver: zodResolver(nearFilterSchema),
    defaultValues: toNearFormValues(near),
  });
  const [named, setNamed] = useState<NamedCentre | null>(near?.label ? near : null);
  const radiusOptions = useMemo(
    () =>
      RADIUS_KM_OPTIONS.map((km) => ({
        value: String(km),
        label: t('{count} km', { count: km }),
      })),
    [t],
  );

  const takeCentre = (centre: NamedCentre) => {
    setNamed(centre);
    const options = { shouldValidate: true, shouldDirty: true };
    methods.setValue('lat', String(centre.lat), options);
    methods.setValue('lng', String(centre.lng), options);
  };
  const submit = methods.handleSubmit((values) => onApply(toNearFilter(values, named)));

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate onSubmit={submit} aria-label={t('Near a location')}>
        <DialogContent dividers>
          <Flex direction="column" spacing={2}>
            <Text size="sm" color="text.secondary">
              {t('Show only records with a map position within the radius of a centre.')}
            </Text>
            <NearMeButton onCentre={takeCentre} />
            <NearPlaceField onCentre={takeCentre} />
            <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <RhfTextField
                name="lat"
                label="Latitude"
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                helperText="-90 to 90, e.g. 12.9716"
              />
              <RhfTextField
                name="lng"
                label="Longitude"
                slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                helperText="-180 to 180, e.g. 77.5946"
              />
            </Flex>
            <RhfSelect name="radiusKm" label="Radius" options={radiusOptions} />
          </Flex>
        </DialogContent>
        <DialogActions>
          {near && (
            <Button onClick={onClear} sx={{ mr: 'auto' }}>
              {t('Remove filter')}
            </Button>
          )}
          <Button onClick={onCancel}>{t('Cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('Apply')}
          </Button>
        </DialogActions>
      </Box>
    </FormProvider>
  );
}
