import { useEffect } from 'react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, FormHelperText, Stack, Text } from '@exyconn/shell/components/ui';
import { RhfRadioGroup, RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { RADIUS_KM_OPTIONS } from '../../../../maps/radius';
import { useMyLocation } from '../../../../maps/useMyLocation';
import type { LeadSearchFormInput } from './lead-search.types';

/** Decimal places kept from the browser's fix: about 10 cm, more than any search needs. */
const COORDINATE_DIGITS = 6;

const CENTRE_CHOICES = [
  { value: 'map', label: 'The map centre', description: 'Pan and zoom the map to the spot.' },
  { value: 'me', label: 'Near me', description: 'Your location, from this browser.' },
  { value: 'coords', label: 'Latitude and longitude', description: 'Type the coordinates.' },
] as const;

/** Where the reader is, as the browser reports it, with a way to ask again. */
function NearMe({ locate }: Readonly<{ locate: ReturnType<typeof useMyLocation> }>) {
  const t = useT();
  const { control } = useFormContext<LeadSearchFormInput>();
  const [lat, lng] = useWatch({ control, name: ['lat', 'lng'] });
  const { errors } = useFormState({ control, name: 'lat' });
  const found = lat !== '' && lng !== '';
  return (
    <Stack spacing={1}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          startIcon={<MyLocationIcon />}
          disabled={locate.locating}
          onClick={locate.locate}
        >
          {locate.locating ? t('Finding you…') : t('Locate me')}
        </Button>
        {found && (
          <Text size="sm" color="text.secondary" role="status">
            {t('Your location: {lat}, {lng}', { lat, lng })}
          </Text>
        )}
      </Flex>
      {locate.error && <Alert severity="warning">{t(locate.error)}</Alert>}
      {!found && errors.lat?.message && (
        <FormHelperText error>{t(errors.lat.message)}</FormHelperText>
      )}
    </Stack>
  );
}

/**
 * "Around a point": the centre (the map's, the reader's own, or typed coordinates) and the
 * radius in kilometres, which the map draws as a red circle.
 */
export function LeadSearchCentreFields() {
  const t = useT();
  const { control, setValue } = useFormContext<LeadSearchFormInput>();
  const centre = useWatch({ control, name: 'centre' });
  const locate = useMyLocation();
  const { locate: askBrowser, position } = locate;

  // Choosing "Near me" asks the browser straight away.
  useEffect(() => {
    if (centre === 'me') {
      askBrowser();
    }
  }, [centre, askBrowser]);
  useEffect(() => {
    if (position) {
      setValue('lat', position.lat.toFixed(COORDINATE_DIGITS), { shouldValidate: true });
      setValue('lng', position.lng.toFixed(COORDINATE_DIGITS), { shouldValidate: true });
    }
  }, [position, setValue]);

  const radiusOptions = RADIUS_KM_OPTIONS.map((km) => ({
    value: String(km),
    label: t('{km} km', { km }),
  }));
  return (
    <Stack spacing={2}>
      <RhfRadioGroup name="centre" label="Around" options={CENTRE_CHOICES} />
      {centre === 'me' && <NearMe locate={locate} />}
      {centre === 'coords' && (
        <Flex direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RhfTextField
            name="lat"
            label="Latitude"
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            helperText="From -90 to 90, e.g. 12.9716"
          />
          <RhfTextField
            name="lng"
            label="Longitude"
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            helperText="From -180 to 180, e.g. 77.5946"
          />
        </Flex>
      )}
      <RhfSelect
        name="radiusKm"
        label="Radius"
        options={radiusOptions}
        helperText="The red circle on the map"
      />
    </Stack>
  );
}
