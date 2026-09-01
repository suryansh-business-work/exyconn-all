import React from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Download, Crop, Settings } from '@mui/icons-material';
import { CanvasSize, ExportFormat } from '../../types';

interface CanvasToolbarProps {
  size: CanvasSize;
  format: ExportFormat;
  hasCustomSettings?: boolean;
  hasCroppedImage?: boolean;
  onSettingsClick: () => void;
  onCropClick: () => void;
  onDownloadClick: () => void;
}

const getCategoryColor = (category: string): 'warning' | 'info' | 'success' | 'default' => {
  switch (category) {
    case 'favicon':
      return 'warning';
    case 'icon':
      return 'info';
    case 'logo':
      return 'success';
    default:
      return 'default';
  }
};

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  size,
  format,
  hasCustomSettings,
  hasCroppedImage,
  onSettingsClick,
  onCropClick,
  onDownloadClick,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', color: 'text.primary' }}>
          {size.label}
        </Typography>
        <Chip
          label={size.category}
          size="small"
          color={getCategoryColor(size.category)}
          sx={{ height: 14, fontSize: '0.5rem', '& .MuiChip-label': { px: 0.5 } }}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.25 }}>
        <Tooltip title="Settings">
          <IconButton
            size="small"
            onClick={onSettingsClick}
            sx={{
              bgcolor: hasCustomSettings ? 'success.main' : 'action.hover',
              color: hasCustomSettings ? 'white' : 'inherit',
              '&:hover': { bgcolor: hasCustomSettings ? 'success.dark' : 'action.selected' },
              width: 20,
              height: 20,
            }}
          >
            <Settings sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Crop for this size">
          <IconButton
            size="small"
            onClick={onCropClick}
            sx={{
              bgcolor: hasCroppedImage ? 'warning.main' : 'action.hover',
              color: hasCroppedImage ? 'white' : 'inherit',
              '&:hover': { bgcolor: hasCroppedImage ? 'warning.dark' : 'action.selected' },
              width: 20,
              height: 20,
            }}
          >
            <Crop sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Download ${format.toUpperCase()}`}>
          <IconButton
            size="small"
            onClick={onDownloadClick}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              width: 20,
              height: 20,
            }}
          >
            <Download sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default CanvasToolbar;
