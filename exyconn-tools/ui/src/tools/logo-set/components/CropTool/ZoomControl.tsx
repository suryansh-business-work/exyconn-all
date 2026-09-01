import React from 'react';
import { Box, Slider, Typography } from '@mui/material';
import { ZoomIn } from '@mui/icons-material';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, onZoomChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, px: 1 }}>
      <ZoomIn sx={{ fontSize: 20, color: 'text.secondary' }} />
      <Slider
        value={zoom}
        min={1}
        max={3}
        step={0.1}
        onChange={(_, value) => onZoomChange(value as number)}
        size="small"
        sx={{ flex: 1 }}
      />
      <Typography variant="caption" sx={{ minWidth: 40 }}>
        {zoom.toFixed(1)}x
      </Typography>
    </Box>
  );
};

export default ZoomControl;
