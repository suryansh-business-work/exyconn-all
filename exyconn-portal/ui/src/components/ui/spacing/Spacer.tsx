import Box from '@mui/material/Box';
import { space } from './spacing';
import type { SpaceSize } from './spacing';

/** Fixed-size gap box for non-sx layouts (e.g. between siblings outside a Stack). */
export interface SpacerProps {
  size?: SpaceSize;
  axis?: 'horizontal' | 'vertical';
}

export function Spacer({ size = 'md', axis = 'vertical' }: SpacerProps) {
  const value = space[size];
  return (
    <Box
      sx={axis === 'vertical' ? { height: value, flexShrink: 0 } : { width: value, flexShrink: 0 }}
    />
  );
}
