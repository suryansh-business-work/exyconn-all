import React from 'react';
import Box from '@mui/material/Box';
import { accentGradient } from '../../theme/tokens';

/** Gradient text for the accent half of a display headline. */
const AccentText: React.FC<Readonly<{ children: React.ReactNode }>> = ({ children }) => (
  <Box
    component="span"
    sx={{
      backgroundImage: accentGradient,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      display: 'inline',
    }}
  >
    {children}
  </Box>
);

export default AccentText;
