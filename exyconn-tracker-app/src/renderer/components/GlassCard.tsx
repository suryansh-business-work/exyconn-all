import Paper, { type PaperProps } from '@mui/material/Paper';
import type { SxProps, Theme } from '@mui/material/styles';
import { glass } from '../theme';

/** MUI's `sx` is either a single style or an array of them. */
type SxArray = Extract<SxProps<Theme>, readonly unknown[]>;
type SxEntry = SxArray[number];

/** `Array.isArray` cannot narrow a ReadonlyArray out of the union, so guard explicitly. */
function isSxArray(sx: SxProps<Theme>): sx is SxArray {
  return Array.isArray(sx);
}

/** MUI's documented way to merge a caller's `sx` with a component's own. */
function toArray(sx: SxProps<Theme> | undefined): readonly SxEntry[] {
  if (sx === undefined) {
    return [];
  }
  if (isSxArray(sx)) {
    return sx;
  }
  return [sx];
}

/**
 * Every surface in the app is one of these: a frosted, translucent MUI Paper.
 * The blur only resolves because the gradient sits on AppBackground behind it —
 * an opaque parent would leave nothing to sample.
 */
export default function GlassCard({ sx, ...rest }: Readonly<PaperProps>): JSX.Element {
  return (
    <Paper
      {...rest}
      sx={[
        (theme) => ({
          ...glass(theme),
          padding: theme.spacing(2.5),
          transition: 'box-shadow 220ms ease, background-color 220ms ease, transform 220ms ease',
        }),
        ...toArray(sx),
      ]}
    />
  );
}
