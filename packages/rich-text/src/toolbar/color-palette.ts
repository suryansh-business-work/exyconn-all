import { color } from '@exyconn/ui';

export interface Swatch {
  label: string;
  value: string;
}

/** Text colours, drawn from the design-system ramps so articles stay on brand. */
export const TEXT_SWATCHES: readonly Swatch[] = [
  { label: 'Ink', value: color.neutral[900] },
  { label: 'Grey', value: color.neutral[500] },
  { label: 'Blue', value: color.blue[600] },
  { label: 'Indigo', value: color.indigo[600] },
  { label: 'Violet', value: color.violet[500] },
  { label: 'Pink', value: color.pink[500] },
  { label: 'Red', value: color.red[800] },
  { label: 'Orange', value: color.orange[700] },
  { label: 'Amber', value: color.amber[700] },
  { label: 'Green', value: color.green[600] },
  { label: 'Emerald', value: color.emerald[800] },
  { label: 'Teal', value: color.teal[600] },
];

/** Highlighter colours — the light end of the ramps, so dark text stays readable on them. */
export const HIGHLIGHT_SWATCHES: readonly Swatch[] = [
  { label: 'Yellow', value: color.amber[200] },
  { label: 'Blue', value: color.azure[100] },
  { label: 'Violet', value: color.violet[300] },
  { label: 'Pink', value: color.pink[300] },
  { label: 'Green', value: color.green[300] },
  { label: 'Grey', value: color.neutral[100] },
];
