import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { LogoSettings, ExportFormat, CanvasSize } from '../../types';
import CanvasCard from '../CanvasCard/CanvasCard';

interface SizeSectionProps {
  title: string;
  emoji: string;
  sizes: CanvasSize[];
  image: string;
  format: ExportFormat;
  croppedImages: Record<string, string>;
  onCroppedImage: (sizeKey: string, croppedImage: string) => void;
  sizeSettings: Record<string, LogoSettings>;
  onSizeSettings: (sizeKey: string, settings: LogoSettings | null) => void;
  globalSettings: LogoSettings;
  isInScope: (sizeKey: string, category: string) => boolean;
  getEffectiveSettings: (sizeKey: string) => LogoSettings;
  borderColor?: string;
}

const SizeSection: React.FC<SizeSectionProps> = ({
  title,
  emoji,
  sizes,
  image,
  format,
  croppedImages,
  onCroppedImage,
  sizeSettings,
  onSizeSettings,
  globalSettings,
  isInScope,
  getEffectiveSettings,
  borderColor = 'divider',
}) => {
  if (sizes.length === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        border: 1,
        borderColor,
        mb: 1.5,
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="caption">{emoji}</Typography>
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
        <Chip
          label={sizes.length}
          size="small"
          color={borderColor === 'primary.main' ? 'primary' : 'default'}
          sx={{ height: 18, fontSize: '0.65rem' }}
        />
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
        {sizes.map((size) => {
          const sizeKey = `${size.category}-${size.width}`;
          const effectiveSettings = getEffectiveSettings(sizeKey);
          const hasCustomSettings = !!sizeSettings[sizeKey];
          const isSelected = isInScope(sizeKey, size.category);
          return (
            <CanvasCard
              key={size.label}
              image={image}
              size={size}
              settings={effectiveSettings}
              format={format}
              croppedImage={croppedImages[sizeKey]}
              onCroppedImage={onCroppedImage}
              hasCustomSettings={hasCustomSettings}
              isSelected={isSelected}
              onSizeSettings={(newSettings) => onSizeSettings(sizeKey, newSettings)}
              globalSettings={globalSettings}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

export default SizeSection;
