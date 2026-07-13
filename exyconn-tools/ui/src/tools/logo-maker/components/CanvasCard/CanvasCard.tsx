import React, { useState, useCallback, useRef } from 'react';
import { Paper, Box, Modal, Backdrop } from '@mui/material';
import { CanvasSize, LogoSettings, ExportFormat } from '../../types';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
import CropTool from '../CropTool/CropTool';
import SizeSettingsDrawer from '../SizeSettingsDrawer/SizeSettingsDrawer';
import ImagePreviewDialog from '../ImagePreviewDialog/ImagePreviewDialog';
import { CroppedBadge, CustomSettingsBadge } from './CanvasBadges';
import CanvasToolbar from './CanvasToolbar';
import CanvasPreview from './CanvasPreview';

interface Props {
  image: string;
  size: CanvasSize;
  settings: LogoSettings;
  format: ExportFormat;
  onCroppedImage?: (sizeKey: string, croppedImage: string) => void;
  croppedImage?: string;
  hasCustomSettings?: boolean;
  isSelected?: boolean;
  onSizeSettings?: (settings: LogoSettings | null) => void;
  globalSettings?: LogoSettings;
}

const CanvasCard: React.FC<Props> = ({
  image,
  size,
  settings,
  format,
  onCroppedImage,
  croppedImage,
  hasCustomSettings,
  isSelected,
  onSizeSettings,
  globalSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { renderToCanvas, downloadCanvas } = useCanvasRenderer();
  const [showCrop, setShowCrop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const displaySize = Math.min(120, size.width);
  const imageToUse = croppedImage || image;
  const isCropped = !!croppedImage;

  const handleDownload = () => {
    const exportCanvas = renderToCanvas(
      imageToUse,
      size.width,
      size.height,
      settings,
      format,
      isCropped,
      size.category as 'favicon' | 'icon' | 'logo'
    );
    downloadCanvas(exportCanvas, `logo-${size.width}x${size.height}`, format);
  };

  const handleCropSave = (cropped: string) => {
    if (onCroppedImage) {
      onCroppedImage(`${size.category}-${size.width}`, cropped);
    }
    setShowCrop(false);
  };

  const handleClearCrop = () => {
    if (onCroppedImage) {
      onCroppedImage(`${size.category}-${size.width}`, '');
    }
  };

  const handleImageClick = () => {
    if (canvasRef.current) {
      setPreviewUrl(canvasRef.current.toDataURL('image/png'));
      setShowPreview(true);
    }
  };

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const handleSettingsSave = (newSettings: LogoSettings) => {
    if (onSizeSettings) {
      onSizeSettings(newSettings);
    }
  };

  const handleSettingsReset = () => {
    if (onSizeSettings) {
      onSizeSettings(null);
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 1,
          border: 2,
          borderColor: isCropped
            ? 'warning.main'
            : isSelected
              ? 'primary.main'
              : hasCustomSettings
                ? 'success.main'
                : 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          transition: 'all 0.2s',
          bgcolor: 'background.paper',
          position: 'relative',
          '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 },
        }}
      >
        {isCropped && <CroppedBadge onClearCrop={handleClearCrop} />}
        {hasCustomSettings && <CustomSettingsBadge />}

        <CanvasToolbar
          size={size}
          format={format}
          hasCustomSettings={hasCustomSettings}
          hasCroppedImage={!!croppedImage}
          onSettingsClick={() => setShowSettings(true)}
          onCropClick={() => setShowCrop(true)}
          onDownloadClick={handleDownload}
        />

        <CanvasPreview
          image={imageToUse}
          size={size}
          settings={settings}
          format={format}
          isCropped={isCropped}
          displaySize={displaySize}
          onImageClick={handleImageClick}
          onCanvasReady={handleCanvasReady}
        />
      </Paper>

      <Modal
        open={showCrop}
        onClose={() => setShowCrop(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 300 } }}
      >
        <Box
          sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', outline: 'none' }}
        >
          <CropTool
            image={image}
            onSave={handleCropSave}
            onClose={() => setShowCrop(false)}
            targetSize={{ width: size.width, height: size.height }}
          />
        </Box>
      </Modal>

      <SizeSettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={handleSettingsSave}
        onReset={handleSettingsReset}
        sizeLabel={size.label}
        hasCustomSettings={hasCustomSettings}
        globalSettings={globalSettings}
        isIcon={size.category === 'icon'}
      />

      <ImagePreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={previewUrl}
        label={size.label}
      />
    </>
  );
};

export default CanvasCard;
