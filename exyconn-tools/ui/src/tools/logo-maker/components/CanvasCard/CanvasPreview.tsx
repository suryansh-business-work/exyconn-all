import React, { useRef, useEffect } from 'react';
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
  onImageClick: () => void;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  image,
  size,
  settings,
  format,
  isCropped,
  displaySize,
  onImageClick,
  onCanvasReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { renderCanvas } = useCanvasRenderer();

  useEffect(() => {
    if (canvasRef.current) {
      const exportSettings = { ...settings, transparent: format === 'png' && settings.transparent };
      renderCanvas(canvasRef.current, {
        image,
        width: size.width,
        height: size.height,
        settings: exportSettings,
        isCropped,
        category: size.category,
      });
      onCanvasReady(canvasRef.current);
    }
  }, [image, size, settings, format, renderCanvas, isCropped, onCanvasReady]);

  return (
    <Box
      onClick={onImageClick}
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
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{
          width: displaySize,
          height: displaySize,
          borderRadius: settings.borderRadius > 0 ? `${settings.borderRadius}%` : undefined,
        }}
      />
    </Box>
  );
};

export default CanvasPreview;
