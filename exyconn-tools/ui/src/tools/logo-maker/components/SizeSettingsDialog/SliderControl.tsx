import React from 'react';
import { Box, Typography, Slider } from '@mui/material';

export interface SliderControlProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ icon, label, value, min, max, step, display, onChange }) => (
  <Box sx={{ mb: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {React.cloneElement(icon as React.ReactElement<{ sx?: object }>, { sx: { fontSize: 16, color: 'action.active' } })}
        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
          {label}
        </Typography>
      </Box>
      <Typography
        variant="caption"
        sx={{
          bgcolor: 'action.hover',
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          fontFamily: 'monospace',
          fontSize: '0.7rem',
        }}
      >
        {display}
      </Typography>
    </Box>
    <Slider value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v as number)} size="small" />
  </Box>
);

export default SliderControl;
