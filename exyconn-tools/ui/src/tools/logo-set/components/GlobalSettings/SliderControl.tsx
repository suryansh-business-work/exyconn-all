import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { SliderControlProps } from './types';

const SliderControl: React.FC<SliderControlProps> = ({ icon, label, value, min, max, step, display, onChange }) => (
  <Box sx={{ mb: 0.75 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {React.cloneElement(icon as React.ReactElement<{ sx?: object }>, {
          sx: { fontSize: 14, color: 'action.active' },
        })}
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          bgcolor: 'action.hover',
          px: 0.5,
          py: 0,
          borderRadius: 0.5,
          fontFamily: 'monospace',
          fontSize: '0.6rem',
        }}
      >
        {display}
      </Typography>
    </Box>
    <Slider
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(_, v) => onChange(v as number)}
      size="small"
      sx={{ py: 0.5 }}
    />
  </Box>
);

export default SliderControl;
