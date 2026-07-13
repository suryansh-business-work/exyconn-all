import React from 'react';
import { Box, Typography, Tooltip, } from '@mui/material';
import Grid from '@mui/material/Grid2';

interface ColorPickerProps {
  label: string;
  colors: string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, colors, selectedColor, onColorChange }) => {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        {colors.map((color) => (
          <Tooltip key={color} title={color}>
            <Box
              onClick={() => onColorChange(color)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: color,
                cursor: 'pointer',
                border: 2,
                borderColor: selectedColor === color ? 'common.white' : 'transparent',
                boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Custom:
        </Typography>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={{ width: 40, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }}
        />
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {selectedColor}
        </Typography>
      </Box>
    </Grid>
  );
};

export default ColorPicker;
