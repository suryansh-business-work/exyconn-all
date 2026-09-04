import type { PexelsSearchFilters } from '@/graphql/generated';
import type { PexelsKind } from './PexelsTab';

/** One entry in a filter dropdown. An empty value is the "Any" row. */
export interface FilterOption {
  value: string;
  label: string;
}

/** What the filter row holds. Every field is `''` until the user narrows the search. */
export interface PexelsFilterState {
  orientation: string;
  size: string;
  color: string;
  duration: string;
}

export const EMPTY_FILTERS: PexelsFilterState = {
  orientation: '',
  size: '',
  color: '',
  duration: '',
};

/** Pexels' `orientation` values, labelled the way the dialog talks about shape. */
export const ORIENTATION_OPTIONS: readonly FilterOption[] = [
  { value: 'landscape', label: 'Horizontal' },
  { value: 'portrait', label: 'Vertical' },
  { value: 'square', label: 'Square' },
];

/** Pexels' `size` values mean megapixels for photos and resolution for clips. */
export const PHOTO_SIZE_OPTIONS: readonly FilterOption[] = [
  { value: 'large', label: 'Large (24MP+)' },
  { value: 'medium', label: 'Medium (12MP+)' },
  { value: 'small', label: 'Small (4MP+)' },
];

export const VIDEO_SIZE_OPTIONS: readonly FilterOption[] = [
  { value: 'large', label: 'Large (4K)' },
  { value: 'medium', label: 'Medium (Full HD)' },
  { value: 'small', label: 'Small (HD)' },
];

/** The twelve colour names Pexels' photo search accepts. */
export const COLOR_OPTIONS: readonly FilterOption[] = [
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'turquoise', label: 'Turquoise' },
  { value: 'blue', label: 'Blue' },
  { value: 'violet', label: 'Violet' },
  { value: 'pink', label: 'Pink' },
  { value: 'brown', label: 'Brown' },
  { value: 'black', label: 'Black' },
  { value: 'gray', label: 'Gray' },
  { value: 'white', label: 'White' },
];

/** Clip-length bands, mapped to the `min_duration` / `max_duration` seconds Pexels takes. */
interface DurationOption extends FilterOption {
  min: number | null;
  max: number | null;
}

export const DURATION_OPTIONS: readonly DurationOption[] = [
  { value: 'short', label: 'Under 15s', min: null, max: 15 },
  { value: 'medium', label: '15s – 1 min', min: 15, max: 60 },
  { value: 'long', label: 'Over 1 min', min: 60, max: null },
];

/** `''` means the user left the dropdown on "Any", which Pexels expects as an absent arg. */
const orNull = (value: string): string | null => value || null;

/**
 * Turns the filter row into the API arguments for one tab. Colour only reaches the photo
 * search and duration only the video search — Pexels rejects the other combination.
 */
export function toApiFilters(kind: PexelsKind, state: PexelsFilterState): PexelsSearchFilters {
  const shared = { orientation: orNull(state.orientation), size: orNull(state.size) };
  if (kind === 'photos') {
    return { ...shared, color: orNull(state.color) };
  }
  const band = DURATION_OPTIONS.find((option) => option.value === state.duration);
  return { ...shared, minDuration: band?.min ?? null, maxDuration: band?.max ?? null };
}
