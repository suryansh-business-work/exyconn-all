import React from 'react';
import { Box, Slider, Typography, Stack } from '@mui/material';
import { RotateRight, ZoomIn, SwapHoriz, SwapVert, Padding } from '@mui/icons-material';
import { LogoSettings } from '../../types';

interface Props {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
  showMore: boolean;
}

const TransformControls: React.FC<Props> = ({ settings, onChange, showMore }) => {
  const handleChange = (key: keyof LogoSettings, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Box>
      {/* Scale */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <ZoomIn fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Scale: {settings.scale}%
          </Typography>
        </Stack>
        <Slider
          value={settings.scale}
          onChange={(_, v) => handleChange('scale', v as number)}
          min={10}
          max={200}
          size="small"
        />
      </Box>

      {/* Rotation */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <RotateRight fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Rotation: {settings.rotation}°
          </Typography>
        </Stack>
        <Slider
          value={settings.rotation}
          onChange={(_, v) => handleChange('rotation', v as number)}
          min={-180}
          max={180}
          size="small"
        />
      </Box>

      {/* Padding */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Padding fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Padding: {settings.padding}%
          </Typography>
        </Stack>
        <Slider
          value={settings.padding}
          onChange={(_, v) => handleChange('padding', v as number)}
          min={0}
          max={50}
          size="small"
        />
      </Box>

      {showMore && (
        <>
          {/* Position X */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <SwapHoriz fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                X Offset: {settings.x}%
              </Typography>
            </Stack>
            <Slider
              value={settings.x}
              onChange={(_, v) => handleChange('x', v as number)}
              min={-50}
              max={50}
              size="small"
            />
          </Box>

          {/* Position Y */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <SwapVert fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Y Offset: {settings.y}%
              </Typography>
            </Stack>
            <Slider
              value={settings.y}
              onChange={(_, v) => handleChange('y', v as number)}
              min={-50}
              max={50}
              size="small"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default TransformControls;
