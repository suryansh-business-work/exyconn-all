/**
 * Google Places API (New) Autocomplete for the lead generator's "Where" box, called from this
 * server with the same server key as Text Search, so suggestions work without a browser key.
 * Only regions are suggested — cities, areas, postcodes, countries — since "Where" names a place
 * to search in, not a business.
 */

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const TIMEOUT_MS = 8000;

export const MIN_SUGGEST_LENGTH = 2;
export const MAX_SUGGEST_LENGTH = 100;

export interface LocationSuggestion {
  placeId: string;
  /** The whole suggestion, e.g. "Koramangala, Bengaluru, Karnataka, India". */
  text: string;
  mainText: string;
  secondaryText: string;
}

interface PredictionPayload {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } };
}

interface AutocompletePayload {
  suggestions?: Array<{ placePrediction?: PredictionPayload }>;
}

function toSuggestion(prediction: PredictionPayload | undefined): LocationSuggestion | null {
  const text = prediction?.text?.text ?? '';
  if (!prediction?.placeId || text === '') {
    return null;
  }
  return {
    placeId: prediction.placeId,
    text,
    mainText: prediction.structuredFormat?.mainText?.text ?? text,
    secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
  };
}

/** Up to five region suggestions for what has been typed. Google's own error message is kept. */
export async function suggestLocations(
  apiKey: string,
  input: string,
): Promise<LocationSuggestion[]> {
  const response = await fetch(AUTOCOMPLETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({ input, includedPrimaryTypes: ['(regions)'] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Google Places suggestions failed (${response.status}): ${detail}`);
  }
  const data = (await response.json()) as AutocompletePayload;
  return (data.suggestions ?? [])
    .map((suggestion) => toSuggestion(suggestion.placePrediction))
    .filter((suggestion): suggestion is LocationSuggestion => suggestion !== null);
}
