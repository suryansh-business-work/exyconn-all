import type { ReactElement } from 'react';
import { Paper, type PaperProps } from '@exyconn/ui';
import type { SxProps, Theme } from '@exyconn/ui';
import { surface } from '../theme';

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

/** Every panel in the app is one of these: an opaque MUI Paper with a hairline border. */
export default function Surface({ sx, ...rest }: Readonly<PaperProps>): ReactElement {
  return (
    <Paper
      {...rest}
      sx={[(theme) => ({ ...surface(theme), padding: theme.spacing(2) }), ...toArray(sx)]}
    />
  );
}
