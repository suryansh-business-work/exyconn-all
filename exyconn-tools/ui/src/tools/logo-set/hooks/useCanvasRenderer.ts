import { useCallback } from 'react';
import { LogoSettings, ExportFormat } from '../types';

interface RenderOptions {
  image: string;
  width: number;
  height: number;
  settings: LogoSettings;
  isCropped?: boolean;
  category?: 'favicon' | 'icon' | 'logo' | 'splash';
}

export const useCanvasRenderer = () => {
  const renderCanvas = useCallback((canvas: HTMLCanvasElement, options: RenderOptions) => {
    const { image, width, height, settings, isCropped, category } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);

      // Apply border radius clipping
      if (settings.borderRadius > 0) {
        const radius = (Math.min(width, height) * settings.borderRadius) / 100;
        roundedRect(ctx, 0, 0, width, height, radius);
        ctx.clip();
      }

      // For preview, show checkerboard pattern to indicate transparency
      // For actual export, the canvas will be truly transparent (handled in renderToCanvas)
      if (settings.transparent) {
        drawCheckerboard(ctx, width, height);
      } else {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply box shadow only for icons
      const applyBoxShadow = category === 'icon' && settings.boxShadow > 0;

      // Calculate padding
      const paddingFactor = 1 - settings.padding / 100;

      // If image is already cropped for this size, draw it with settings applied
      if (isCropped) {
        // Apply scale, rotation, position to cropped image
        const drawWidth = width * settings.scale * paddingFactor;
        const drawHeight = height * settings.scale * paddingFactor;
        const scaleRatio = width / 512;

        ctx.save();
        ctx.translate(width / 2 + settings.x * scaleRatio, height / 2 + settings.y * scaleRatio);
        ctx.rotate((settings.rotation * Math.PI) / 180);

        if (applyBoxShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = settings.boxShadow * (width / 100);
          ctx.shadowOffsetX = settings.boxShadow * 0.2 * (width / 100);
          ctx.shadowOffsetY = settings.boxShadow * 0.3 * (width / 100);
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
        return;
      }

      const aspectRatio = img.width / img.height;
      let drawWidth = width * paddingFactor;
      let drawHeight = drawWidth / aspectRatio;

      if (drawHeight > height * paddingFactor) {
        drawHeight = height * paddingFactor;
        drawWidth = drawHeight * aspectRatio;
      }

      drawWidth *= settings.scale;
      drawHeight *= settings.scale;

      const scaleRatio = width / 512;
      ctx.save();
      ctx.translate(width / 2 + settings.x * scaleRatio, height / 2 + settings.y * scaleRatio);
      ctx.rotate((settings.rotation * Math.PI) / 180);
      // Apply image filters (brightness, contrast, grayscale)
      const filters: string[] = [];
      if (settings.brightness !== undefined && settings.brightness !== 100) {
        filters.push(`brightness(${settings.brightness}%)`);
      }
      if (settings.contrast !== undefined && settings.contrast !== 100) {
        filters.push(`contrast(${settings.contrast}%)`);
      }
      if (settings.grayscale !== undefined && settings.grayscale > 0) {
        filters.push(`grayscale(${settings.grayscale}%)`);
      }
      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }

      if (applyBoxShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = settings.boxShadow * (width / 100);
        ctx.shadowOffsetX = settings.boxShadow * 0.2 * (width / 100);
        ctx.shadowOffsetY = settings.boxShadow * 0.3 * (width / 100);
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();
    };
    img.src = image;
  }, []);

  const renderToCanvas = useCallback(
    (
      image: string,
      width: number,
      height: number,
      settings: LogoSettings,
      format: ExportFormat,
      isCropped?: boolean,
      category?: 'favicon' | 'icon' | 'logo'
    ): HTMLCanvasElement => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      const img = new Image();
      img.src = image;

      // Synchronous render for download
      ctx.clearRect(0, 0, width, height);

      // Apply border radius clipping for export
      if (settings.borderRadius > 0) {
        const radius = (Math.min(width, height) * settings.borderRadius) / 100;
        roundedRect(ctx, 0, 0, width, height, radius);
        ctx.clip();
      }

      const exportSettings = { ...settings, transparent: format === 'png' && settings.transparent };

      if (exportSettings.transparent) {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      if (img.complete) {
        if (isCropped) {
          drawCroppedImageToContext(ctx, img, width, height, settings, category);
        } else {
          drawImageToContext(ctx, img, width, height, settings, category);
        }
      } else {
        img.onload = () => {
          if (isCropped) {
            drawCroppedImageToContext(ctx, img, width, height, settings, category);
          } else {
            drawImageToContext(ctx, img, width, height, settings, category);
          }
        };
      }

      return canvas;
    },
    []
  );

  const downloadCanvas = useCallback((canvas: HTMLCanvasElement, filename: string, format: ExportFormat) => {
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    const link = document.createElement('a');
    link.download = `${filename}.${format}`;
    link.href = canvas.toDataURL(mimeType, 0.95);
    link.click();
  }, []);

  return { renderCanvas, renderToCanvas, downloadCanvas };
};

const drawImageToContext = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  settings: LogoSettings,
  category?: 'favicon' | 'icon' | 'logo' | 'splash'
) => {
  // Calculate padding
  const paddingFactor = 1 - settings.padding / 100;

  const aspectRatio = img.width / img.height;
  let drawWidth = width * paddingFactor;
  let drawHeight = drawWidth / aspectRatio;

  if (drawHeight > height * paddingFactor) {
    drawHeight = height * paddingFactor;
    drawWidth = drawHeight * aspectRatio;
  }

  drawWidth *= settings.scale;
  drawHeight *= settings.scale;

  const scaleRatio = width / 512;
  ctx.save();
  ctx.translate(width / 2 + settings.x * scaleRatio, height / 2 + settings.y * scaleRatio);
  ctx.rotate((settings.rotation * Math.PI) / 180);

  // Apply image filters (brightness, contrast, grayscale)
  const filters: string[] = [];
  if (settings.brightness !== undefined && settings.brightness !== 100) {
    filters.push(`brightness(${settings.brightness}%)`);
  }
  if (settings.contrast !== undefined && settings.contrast !== 100) {
    filters.push(`contrast(${settings.contrast}%)`);
  }
  if (settings.grayscale !== undefined && settings.grayscale > 0) {
    filters.push(`grayscale(${settings.grayscale}%)`);
  }
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  // Apply box shadow only for icons
  if (category === 'icon' && settings.boxShadow > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = settings.boxShadow * (width / 100);
    ctx.shadowOffsetX = settings.boxShadow * 0.2 * (width / 100);
    ctx.shadowOffsetY = settings.boxShadow * 0.3 * (width / 100);
  }

  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
};

const drawCroppedImageToContext = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  settings: LogoSettings,
  category?: 'favicon' | 'icon' | 'logo' | 'splash'
) => {
  // Calculate padding
  const paddingFactor = 1 - settings.padding / 100;

  // Apply scale, rotation, position to cropped image
  const drawWidth = width * settings.scale * paddingFactor;
  const drawHeight = height * settings.scale * paddingFactor;
  const scaleRatio = width / 512;

  ctx.save();
  ctx.translate(width / 2 + settings.x * scaleRatio, height / 2 + settings.y * scaleRatio);
  ctx.rotate((settings.rotation * Math.PI) / 180);

  // Apply image filters (brightness, contrast, grayscale)
  const filters: string[] = [];
  if (settings.brightness !== undefined && settings.brightness !== 100) {
    filters.push(`brightness(${settings.brightness}%)`);
  }
  if (settings.contrast !== undefined && settings.contrast !== 100) {
    filters.push(`contrast(${settings.contrast}%)`);
  }
  if (settings.grayscale !== undefined && settings.grayscale > 0) {
    filters.push(`grayscale(${settings.grayscale}%)`);
  }
  if (filters.length > 0) {
    ctx.filter = filters.join(' ');
  }

  // Apply box shadow only for icons
  if (category === 'icon' && settings.boxShadow > 0) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = settings.boxShadow * (width / 100);
    ctx.shadowOffsetX = settings.boxShadow * 0.2 * (width / 100);
    ctx.shadowOffsetY = settings.boxShadow * 0.3 * (width / 100);
  }

  ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
};

const roundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const size = Math.max(4, width / 16);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#e5e5e5';
  for (let i = 0; i < width; i += size * 2) {
    for (let j = 0; j < height; j += size * 2) {
      ctx.fillRect(i, j, size, size);
      ctx.fillRect(i + size, j + size, size, size);
    }
  }
};
