import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { LogoSettings, ExportFormat, CanvasSize, CustomSize } from '../../types';
import CanvasCard from '../CanvasCard/CanvasCard';

interface CustomSizesSectionProps {
  customSizes: CustomSize[];
  image: string;
  format: ExportFormat;
  croppedImages: Record<string, string>;
  onCroppedImage: (sizeKey: string, croppedImage: string) => void;
  sizeSettings: Record<string, LogoSettings>;
  onSizeSettings: (sizeKey: string, settings: LogoSettings | null) => void;
  globalSettings: LogoSettings;
  isInScope: (sizeKey: string, category: string) => boolean;
  getEffectiveSettings: (sizeKey: string) => LogoSettings;
}

const CustomSizesSection: React.FC<CustomSizesSectionProps> = ({
  customSizes,
  image,
  format,
  croppedImages,
  onCroppedImage,
  sizeSettings,
  onSizeSettings,
  globalSettings,
  isInScope,
  getEffectiveSettings,
}) => {
  if (customSizes.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        border: 1,
        borderColor: 'primary.main',
        mb: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="caption">✨</Typography>
        <Typography variant="subtitle2" fontWeight={600}>
          Custom Sizes
        </Typography>
        <Chip label={customSizes.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
          },
          gap: 1,
        }}
      >
        {customSizes.map((cs) => {
          const sizeKey = `custom-${cs.id}`;
          const canvasSize: CanvasSize = {
            width: cs.width,
            height: cs.height,
            label: cs.label || `${cs.width}×${cs.height}`,
            category: 'splash',
          };
          return (
            <CanvasCard
              key={cs.id}
              image={image}
              size={canvasSize}
              settings={getEffectiveSettings(sizeKey)}
              format={format}
              croppedImage={croppedImages[sizeKey]}
              onCroppedImage={onCroppedImage}
              hasCustomSettings={!!sizeSettings[sizeKey]}
              isSelected={isInScope(sizeKey, 'custom')}
              onSizeSettings={(newSettings) => onSizeSettings(sizeKey, newSettings)}
              globalSettings={globalSettings}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default CustomSizesSection;
