import React from 'react';
import {
  Box,
  Slider,
  Typography,
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { RoundedCorner, Layers, Warning } from '@mui/icons-material';
import { LogoSettings, calculateContrastRatio, getContrastRating } from '../../types';
import { useColorExtraction } from './useColorExtraction';
import ColorSwatchGrid from './ColorSwatchGrid';

interface Props {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
  currentImage?: string;
}

const PRESET_COLORS = [
  '#ffffff', '#000000', '#f3f4f6', '#e5e7eb', '#3b82f6',
  '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
];

const BackgroundControls: React.FC<Props> = ({ settings, onChange, currentImage }) => {
  const { extractedColors, isExtractingColors } = useColorExtraction(currentImage);

  const contrastWithWhite = calculateContrastRatio(settings.backgroundColor, '#ffffff');
  const contrastWithBlack = calculateContrastRatio(settings.backgroundColor, '#000000');
  const contrastRating = getContrastRating(Math.max(contrastWithWhite, contrastWithBlack));

  const handleChange = (key: keyof LogoSettings, value: number | boolean | string) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={settings.transparent}
            onChange={(e) => handleChange('transparent', e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="caption">Transparent</Typography>}
        sx={{ mb: 1 }}
      />

      {!settings.transparent && (
        <>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <TextField
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              size="small"
              sx={{ width: 50, '& input': { height: 24, padding: 0.5, cursor: 'pointer' } }}
            />
            <TextField
              value={settings.backgroundColor}
              onChange={(e) => handleChange('backgroundColor', e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              placeholder="#ffffff"
            />
          </Stack>

          {!contrastRating.passes.aa && (
            <Alert severity="warning" icon={<Warning fontSize="small" />} sx={{ mb: 1, py: 0, fontSize: '0.7rem' }}>
              Low contrast ({contrastRating.rating})
            </Alert>
          )}

          <ColorSwatchGrid
            label="Presets"
            colors={PRESET_COLORS}
            selectedColor={settings.backgroundColor}
            onSelect={(color) => handleChange('backgroundColor', color)}
          />

          <ColorSwatchGrid
            label="From Image"
            colors={extractedColors}
            selectedColor={settings.backgroundColor}
            onSelect={(color) => handleChange('backgroundColor', color)}
            isLoading={isExtractingColors}
          />
        </>
      )}

      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <RoundedCorner fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Corners: {settings.borderRadius}%
          </Typography>
        </Stack>
        <Slider
          value={settings.borderRadius}
          onChange={(_, v) => handleChange('borderRadius', v as number)}
          min={0}
          max={50}
          size="small"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Layers fontSize="small" color="action" />
          <Typography variant="caption" color="text.secondary">
            Shadow: {settings.boxShadow}px
          </Typography>
        </Stack>
        <Slider
          value={settings.boxShadow}
          onChange={(_, v) => handleChange('boxShadow', v as number)}
          min={0}
          max={50}
          size="small"
        />
      </Box>
    </Box>
  );
};

export default BackgroundControls;
