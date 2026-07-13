import React from 'react';
import { Box, Typography, TextField, Alert, Tooltip, IconButton, CircularProgress } from '@mui/material';
import { Palette, Warning, ColorLens } from '@mui/icons-material';
import { LogoSettings, calculateContrastRatio, getContrastRating } from '../../types';

interface BackgroundColorPickerProps {
  backgroundColor: string;
  extractedColors: string[];
  isExtractingColors: boolean;
  onUpdate: (key: keyof LogoSettings, value: string) => void;
}

const BackgroundColorPicker: React.FC<BackgroundColorPickerProps> = ({
  backgroundColor,
  extractedColors,
  isExtractingColors,
  onUpdate,
}) => {
  const contrastWithWhite = calculateContrastRatio(backgroundColor, '#ffffff');
  const contrastWithBlack = calculateContrastRatio(backgroundColor, '#000000');
  const contrastRating = getContrastRating(Math.max(contrastWithWhite, contrastWithBlack));

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
        <Palette sx={{ fontSize: 16 }} color="action" />
        <TextField
          type="color"
          value={backgroundColor}
          onChange={(e) => onUpdate('backgroundColor', e.target.value)}
          size="small"
          sx={{ width: 40, '& input': { p: 0.25, cursor: 'pointer', height: 24 } }}
        />
        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
          {backgroundColor}
        </Typography>
      </Box>

      <Alert
        severity={contrastRating.passes.aa ? 'success' : contrastRating.passes.aaLarge ? 'warning' : 'error'}
        icon={<Warning sx={{ fontSize: 16 }} />}
        sx={{
          py: 0,
          px: 1,
          mb: 0.5,
          '& .MuiAlert-message': { py: 0.25, fontSize: '0.65rem' },
          '& .MuiAlert-icon': { py: 0.25, mr: 0.5 },
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
          Contrast: {Math.max(contrastWithWhite, contrastWithBlack).toFixed(1)}:1 - {contrastRating.rating}
        </Typography>
      </Alert>

      {extractedColors.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
          <ColorLens sx={{ fontSize: 14 }} color="action" />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', mr: 0.5 }}>
            From Image:
          </Typography>
          {extractedColors.map((color, index) => (
            <Tooltip key={index} title={`${color} - Click to use`}>
              <IconButton
                size="small"
                onClick={() => onUpdate('backgroundColor', color)}
                sx={{
                  width: 20,
                  height: 20,
                  p: 0,
                  bgcolor: color,
                  border: backgroundColor === color ? 2 : 1,
                  borderColor: backgroundColor === color ? 'primary.main' : 'divider',
                  '&:hover': { transform: 'scale(1.2)' },
                }}
              />
            </Tooltip>
          ))}
          {isExtractingColors && <CircularProgress size={14} />}
        </Box>
      )}
    </Box>
  );
};

export default BackgroundColorPicker;
