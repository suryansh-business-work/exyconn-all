import React from 'react';
import { Box, Typography, Tooltip, Stack, CircularProgress } from '@mui/material';
import { ColorLens } from '@mui/icons-material';

interface ColorSwatchGridProps {
  label: string;
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const ColorSwatchGrid: React.FC<ColorSwatchGridProps> = ({
  label, colors, selectedColor, onSelect, icon, isLoading,
}) => {
  if (isLoading) {
    return <CircularProgress size={16} />;
  }

  if (colors.length === 0) return null;

  return (
    <Box sx={{ mb: 1 }}>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          alignItems: "center",
          mb: 0.5
        }}>
        {icon || <ColorLens fontSize="small" sx={{ fontSize: 14 }} />}
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          {label}
        </Typography>
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {colors.map((color) => (
          <Tooltip key={color} title={color}>
            <Box
              onClick={() => onSelect(color)}
              sx={{
                width: 20,
                height: 20,
                bgcolor: color,
                border: '2px solid',
                cursor: 'pointer',
                borderRadius: 0.5,
                borderColor: selectedColor === color ? 'primary.main' : 'divider',
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default ColorSwatchGrid;
