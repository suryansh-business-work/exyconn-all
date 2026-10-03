import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { fonts, neon } from '../../theme/tokens';

interface StageLabelProps {
  children: React.ReactNode;
  /** Draws the orange measurement tick before the label. */
  tick?: boolean;
  component?: React.ElementType;
}

/** Tiny mono uppercase label — section kickers, counters, metadata. */
const StageLabel: React.FC<Readonly<StageLabelProps>> = ({ children, tick = false, component = 'p' }) => (
  <Typography
    component={component}
    sx={{
      fontFamily: fonts.mono,
      fontSize: '0.7rem',
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: 'text.secondary',
      display: 'flex',
      alignItems: 'center',
      gap: 1.25,
    }}
  >
    {tick && <Box component="span" aria-hidden sx={{ width: 28, height: '1px', bgcolor: neon.orange }} />}
    {children}
  </Typography>
);

export default StageLabel;
