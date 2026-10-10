import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { CanvasSize, LogoSettings, ExportFormat } from '../../types';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';

interface CanvasPreviewProps {
  image: string;
  size: CanvasSize;
  settings: LogoSettings;
  format: ExportFormat;
  isCropped: boolean;
  displaySize: number;
  onImageClick: (canvas: HTMLCanvasElement) => void;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  image,
  size,
  settings,
  format,
  isCropped,
  displaySize,
  onImageClick,
}) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const { renderCanvas } = useCanvasRenderer();

  useEffect(() => {
    if (!canvas) return;
    const exportSettings = { ...settings, transparent: format === 'png' && settings.transparent };
    renderCanvas(canvas, {
      image,
      width: size.width,
      height: size.height,
      settings: exportSettings,
      isCropped,
      category: size.category,
    });
  }, [canvas, image, size, settings, format, renderCanvas, isCropped]);

  return (
    <Box
      sx={{
        width: displaySize,
        height: displaySize,
        border: 1,
        borderColor: 'divider',
        borderRadius: settings.borderRadius > 0 ? `${settings.borderRadius}%` : 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        cursor: 'pointer',
        '&:hover': { opacity: 0.9 },
      }}
    >
      <canvas
        ref={setCanvas}
        width={size.width}
        height={size.height}
        onClick={(e) => onImageClick(e.currentTarget)}
        style={{
          cursor: 'pointer',
          width: displaySize,
          height: displaySize,
          borderRadius: settings.borderRadius > 0 ? `${settings.borderRadius}%` : undefined,
        }}
      />
    </Box>
  );
};

export default CanvasPreview;
