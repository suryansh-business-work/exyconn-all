import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import { Autocomplete, CircularProgress, TextField } from '@exyconn/shell/components/ui';
import {
  PlaceCoordinatesDocument,
  type LeadLocationSuggestion,
  type PlaceCoordinatesQuery,
  type PlaceCoordinatesQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { queryData } from '@exyconn/shell/utils/queryData';
import { useLocationSuggestions } from '../../../pages/lead-generator/forms/lead-search/useLocationSuggestions';
import type { NamedCentre } from './near-filter.types';

type Suggestion = Pick<LeadLocationSuggestion, 'placeId' | 'text'>;

interface NearPlaceFieldProps {
  /** Called with the chosen place's coordinates. */
  onCentre: (centre: NamedCentre) => void;
}

const HINT = 'A city, area or postcode, e.g. Koramangala, Bengaluru';

/** "Search a place": Google's suggestions (through the server key), resolved to coordinates. */
export function NearPlaceField({ onCentre }: Readonly<NearPlaceFieldProps>) {
  const t = useT();
  const client = useApolloClient();
  const [typed, setTyped] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { suggestions, loading } = useLocationSuggestions(typed);

  const locate = async (place: Suggestion): Promise<NamedCentre> => {
    const result = await client.query<PlaceCoordinatesQuery, PlaceCoordinatesQueryVariables>({
      query: PlaceCoordinatesDocument,
      variables: { placeId: place.placeId },
      fetchPolicy: 'network-only',
    });
    const { lat, lng } = queryData(result, 'The place coordinates query').placeCoordinates;
    return { lat, lng, label: place.text };
  };

  const choose = (place: Suggestion | null) => {
    if (!place) {
      return;
    }
    setResolving(true);
    setError(null);
    locate(place)
      .then(onCentre)
      .catch((failure: unknown) => {
        portalLogger.warn('crm: place coordinates lookup failed', failure);
        setError(
          'That place could not be found on the map. Try another, or enter the coordinates.',
        );
      })
      .finally(() => setResolving(false));
  };

  const busy = loading || resolving;
  return (
    <Autocomplete<Suggestion>
      options={suggestions}
      filterOptions={(options) => options}
      getOptionLabel={(option) => option.text}
      isOptionEqualToValue={(option, value) => option.placeId === value.placeId}
      loading={loading}
      loadingText={t('Looking up places…')}
      noOptionsText={t('Type at least two letters of a place')}
      inputValue={typed}
      onInputChange={(_event, value) => setTyped(value)}
      onChange={(_event, value) => choose(value)}
      disabled={resolving}
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('Search a place')}
          error={Boolean(error)}
          helperText={t(error ?? HINT)}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {busy && <CircularProgress size={18} aria-hidden />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
