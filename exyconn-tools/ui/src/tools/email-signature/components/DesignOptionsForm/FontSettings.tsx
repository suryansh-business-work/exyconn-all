import React from 'react';
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FormatSize } from '@mui/icons-material';
import { fontOptions } from '../../types';

type FontSize = 'small' | 'medium' | 'large';

interface FontSettingsProps {
  fontFamily: string;
  fontSize: FontSize;
  onFontFamilyChange: (fontFamily: string) => void;
  onFontSizeChange: (fontSize: FontSize) => void;
}

const FontSettings: React.FC<FontSettingsProps> = ({ fontFamily, fontSize, onFontFamilyChange, onFontSizeChange }) => {
  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Font Family</InputLabel>
          <Select value={fontFamily} label="Font Family" onChange={(e) => onFontFamilyChange(e.target.value)}>
            {fontOptions.map((font: { value: string; label: string }) => (
              <MenuItem key={font.value} value={font.value} sx={{ fontFamily: font.value }}>
                {font.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <FormatSize fontSize="small" /> Font Size
        </Typography>
        <ToggleButtonGroup
          value={fontSize}
          exclusive
          onChange={(_, value) => value && onFontSizeChange(value)}
          size="small"
          fullWidth
        >
          <ToggleButton value="small">Small</ToggleButton>
          <ToggleButton value="medium">Medium</ToggleButton>
          <ToggleButton value="large">Large</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
    </>
  );
};

export default FontSettings;
