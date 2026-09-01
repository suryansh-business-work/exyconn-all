import { useState, useEffect, useCallback } from 'react';

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

      const colors: { r: number; g: number; b: number; count: number }[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 15 && g < 15 && b < 15) continue;

        let found = false;
        for (const c of colors) {
          const dist = Math.abs(c.r - r) + Math.abs(c.g - g) + Math.abs(c.b - b);
          if (dist < 60) {
            c.r = Math.round((c.r * c.count + r) / (c.count + 1));
            c.g = Math.round((c.g * c.count + g) / (c.count + 1));
            c.b = Math.round((c.b * c.count + b) / (c.count + 1));
            c.count++;
            found = true;
            break;
          }
        }

        if (!found && colors.length < 50) {
          colors.push({ r, g, b, count: 1 });
        }
      }

      const sortedColors = colors
        .filter((c) => c.count > 10)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .map((c) => {
          const hex = `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
          return hex;
        });

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
