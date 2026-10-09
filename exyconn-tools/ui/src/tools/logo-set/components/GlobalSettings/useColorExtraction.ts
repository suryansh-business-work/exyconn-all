import { useState, useEffect, useCallback } from 'react';

interface ColorCluster {
  r: number;
  g: number;
  b: number;
  count: number;
}

const isIgnoredPixel = (r: number, g: number, b: number, a: number): boolean =>
  a < 128 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15);

const mergeIntoCluster = (colors: ColorCluster[], r: number, g: number, b: number): boolean => {
  for (const c of colors) {
    const dist = Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b);
    if (dist < 60) {
      c.r = Math.round((c.r * c.count + r) / (c.count + 1));
      c.g = Math.round((c.g * c.count + g) / (c.count + 1));
      c.b = Math.round((c.b * c.count + b) / (c.count + 1));
      c.count++;
      return true;
    }
  }
  return false;
};

const clusterColors = (data: Uint8ClampedArray): ColorCluster[] => {
  const colors: ColorCluster[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isIgnoredPixel(r, g, b, data[i + 3])) continue;

    if (!mergeIntoCluster(colors, r, g, b) && colors.length < 50) {
      colors.push({ r, g, b, count: 1 });
    }
  }

  return colors;
};

const toHex = (c: ColorCluster): string =>
  `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;

export const useColorExtraction = (currentImage?: string) => {
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtractingColors, setIsExtractingColors] = useState(false);

  const extractColorsFromImage = useCallback(async (imageSrc: string) => {
    setIsExtractingColors(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageSrc;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sampleSize = 150;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const data = imageData.data;

      const colors = clusterColors(data);

      const sortedColors = colors
        .filter((c) => c.count > 10)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map(toHex);

      setExtractedColors(sortedColors);
    } catch (error) {
      console.error('Error extracting colors:', error);
      setExtractedColors([]);
    } finally {
      setIsExtractingColors(false);
    }
  }, []);

  useEffect(() => {
    if (currentImage) {
      extractColorsFromImage(currentImage);
    } else {
      setExtractedColors([]);
    }
  }, [currentImage, extractColorsFromImage]);

  return { extractedColors, isExtractingColors };
};
