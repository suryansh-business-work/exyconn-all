import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { fonts } from '../../theme/tokens';

/** Numbered how-to steps with mono step counters. */
const HowToSteps: React.FC<Readonly<{ steps: readonly string[] }>> = ({ steps }) => (
  <Box component="ol" sx={{ listStyle: 'none', display: 'grid', gap: 1.5 }}>
    {steps.map((step, index) => (
      <Box component="li" key={step} sx={{ display: 'flex', gap: 1.5, alignItems: 'baseline' }}>
        <Box
          component="span"
          aria-hidden
          sx={{ fontFamily: fonts.mono, fontSize: '0.75rem', color: 'primary.main', minWidth: 24 }}
        >
          {String(index + 1).padStart(2, '0')}
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {step}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default HowToSteps;
