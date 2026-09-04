import { MenuItem, Stack, TextField } from '@exyconn/ui';
import type { PexelsKind } from './PexelsTab';
import {
  COLOR_OPTIONS,
  DURATION_OPTIONS,
  ORIENTATION_OPTIONS,
  PHOTO_SIZE_OPTIONS,
  VIDEO_SIZE_OPTIONS,
  type FilterOption,
  type PexelsFilterState,
} from './pexels-filters';

interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}

/** One "Any / …" dropdown in the filter row. */
function FilterSelect({ label, value, options, onChange }: Readonly<FilterSelectProps>) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ minWidth: 130, flex: 1 }}
    >
      <MenuItem value="">Any</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

interface PexelsFiltersProps {
  kind: PexelsKind;
  value: PexelsFilterState;
  onChange: (next: PexelsFilterState) => void;
}

/**
 * The filter row above the stock grid. Both tabs filter by shape and size; colour is
 * photo-only and clip length is video-only, matching what the Pexels search supports.
 */
export function PexelsFilters({ kind, value, onChange }: Readonly<PexelsFiltersProps>) {
  const isPhotos = kind === 'photos';
  const set = (key: keyof PexelsFilterState) => (next: string) =>
    onChange({ ...value, [key]: next });

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <FilterSelect
        label="Orientation"
        value={value.orientation}
        options={ORIENTATION_OPTIONS}
        onChange={set('orientation')}
      />
      <FilterSelect
        label="Size"
        value={value.size}
        options={isPhotos ? PHOTO_SIZE_OPTIONS : VIDEO_SIZE_OPTIONS}
        onChange={set('size')}
      />
      {isPhotos ? (
        <FilterSelect
          label="Colour"
          value={value.color}
          options={COLOR_OPTIONS}
          onChange={set('color')}
        />
      ) : (
        <FilterSelect
          label="Length"
          value={value.duration}
          options={DURATION_OPTIONS}
          onChange={set('duration')}
        />
      )}
    </Stack>
  );
}
