import React from 'react';
import { Box, Slider, Typography, Stack } from '@mui/material';
import { Brightness6, Contrast, FilterBAndW } from '@mui/icons-material';
import { LogoSettings } from '../../types';

interface Props {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
}

const ImageAdjustments: React.FC<Props> = ({ settings, onChange }) => {
  const handleChange = (key: keyof LogoSettings, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Box>
      {/* Brightness */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Brightness6 fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Brightness: {settings.brightness}%
          </Typography>
        </Stack>
        <Slider
          value={settings.brightness}
          onChange={(_, v) => handleChange('brightness', v as number)}
          min={0}
          max={200}
          size="small"
          marks={[{ value: 100, label: '' }]}
        />
      </Box>

      {/* Contrast */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Contrast fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Contrast: {settings.contrast}%
          </Typography>
        </Stack>
        <Slider
          value={settings.contrast}
          onChange={(_, v) => handleChange('contrast', v as number)}
          min={0}
          max={200}
          size="small"
          marks={[{ value: 100, label: '' }]}
        />
      </Box>

      {/* Grayscale */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <FilterBAndW fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Grayscale: {settings.grayscale}%
          </Typography>
        </Stack>
        <Slider
          value={settings.grayscale}
          onChange={(_, v) => handleChange('grayscale', v as number)}
          min={0}
          max={100}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default ImageAdjustments;
