import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { DownloadForOffline } from '@mui/icons-material';
import {
  LogoSettings,
  ExportFormat,
  ApplyScope,
  CustomSize,
  FAVICON_SIZES,
  ICON_SIZES,
  LOGO_SIZES,
  SPLASH_SIZES,
  CanvasSize,
} from '../../types';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
import SizeSection from './SizeSection';
import CustomSizesSection from './CustomSizesSection';

interface Props {
  image: string;
  settings: LogoSettings;
  format: ExportFormat;
  applyScope: ApplyScope;
  customSizes: CustomSize[];
  croppedImages: Record<string, string>;
  onCroppedImage: (sizeKey: string, croppedImage: string) => void;
  sizeSettings: Record<string, LogoSettings>;
  onSizeSettings: (sizeKey: string, settings: LogoSettings | null) => void;
}

const PreviewGrid: React.FC<Props> = ({
  image,
  settings,
  format,
  applyScope,
  customSizes,
  croppedImages,
  onCroppedImage,
  sizeSettings,
  onSizeSettings,
}) => {
  const { downloadCanvas, renderToCanvas } = useCanvasRenderer();

  const allSizes = [...FAVICON_SIZES, ...ICON_SIZES, ...LOGO_SIZES, ...SPLASH_SIZES];
  const customCanvasSizes: CanvasSize[] = customSizes.map((cs) => ({
    width: cs.width,
    height: cs.height,
    label: cs.label || `${cs.width}×${cs.height}`,
    category: 'splash' as const,
  }));

  const isInScope = (sizeKey: string, category: string): boolean => {
    if (applyScope === 'all') return true;
    if (applyScope === `${category}-all`) return true;
    if (applyScope === 'custom-all' && sizeKey.startsWith('custom-')) return true;
    return applyScope === sizeKey;
  };

  const getEffectiveSettings = (sizeKey: string): LogoSettings => sizeSettings[sizeKey] || settings;

  const handleDownloadAll = () => {
    const sizesToDownload = [...allSizes, ...customCanvasSizes];
    sizesToDownload.forEach((size, index) => {
      setTimeout(() => {
        const sizeKey =
          size.category === 'splash' && customSizes.some((cs) => cs.width === size.width && cs.height === size.height)
            ? `custom-${customSizes.find((cs) => cs.width === size.width && cs.height === size.height)?.id}`
            : `${size.category}-${size.width}`;
        const imageToUse = croppedImages[sizeKey] || image;
        const isCropped = !!croppedImages[sizeKey];
        const effectiveSettings = getEffectiveSettings(sizeKey);
        const canvas = renderToCanvas(imageToUse, size.width, size.height, effectiveSettings, format, isCropped);
        downloadCanvas(canvas, `logo-${size.width}x${size.height}`, format);
      }, index * 200);
    });
  };

  const sectionProps = {
    image,
    format,
    croppedImages,
    onCroppedImage,
    sizeSettings,
    onSizeSettings,
    globalSettings: settings,
    isInScope,
    getEffectiveSettings,
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          🎨 Preview Gallery
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadForOffline sx={{ fontSize: 18 }} />}
          onClick={handleDownloadAll}
          size="small"
          sx={{ fontSize: '0.75rem' }}
        >
          Download All ({allSizes.length + customSizes.length})
        </Button>
      </Box>

      <SizeSection title="Favicons" emoji="📌" sizes={FAVICON_SIZES} {...sectionProps} />
      <SizeSection title="Icons" emoji="🎯" sizes={ICON_SIZES} {...sectionProps} />
      <SizeSection title="Logos" emoji="📐" sizes={LOGO_SIZES} {...sectionProps} />
      <SizeSection title="Splash Screens" emoji="📱" sizes={SPLASH_SIZES} {...sectionProps} />
      <CustomSizesSection customSizes={customSizes} {...sectionProps} />
    </Box>
  );
};

export default PreviewGrid;
