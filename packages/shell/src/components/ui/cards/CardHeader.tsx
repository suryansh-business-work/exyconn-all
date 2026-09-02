import { forwardRef } from 'react';
import MuiCardHeader, { type CardHeaderProps } from '@mui/material/CardHeader';

/** Brand card header — single wrapper around MUI CardHeader. */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => (
  <MuiCardHeader ref={ref} {...props} />
));
CardHeader.displayName = 'CardHeader';

export type { CardHeaderProps };
