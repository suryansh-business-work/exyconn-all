import type { SxProps, Theme } from '@mui/material/styles';

/** Normalises an `sx` prop to the array form, so a component can prepend its own styles. */
export function toSxArray(sx: SxProps<Theme> | undefined) {
  if (Array.isArray(sx)) {
    return sx;
  }
  return sx ? [sx] : [];
}
