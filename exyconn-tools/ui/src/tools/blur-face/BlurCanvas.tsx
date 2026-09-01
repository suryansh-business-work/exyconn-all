import { useEffect, useRef, useState, PointerEvent } from 'react';
import Box from '@mui/material/Box';
import {
  BlurMode, Rect, Region, canvasPoint, clampRegion, drawRegionOutlines, normalizeRect, renderRedacted,
} from './utils';

interface BlurCanvasProps {
  image: HTMLImageElement;
  regions: readonly Region[];
  mode: BlurMode;
  intensity: number;
  color: string;
  onAddRegion: (rect: Rect) => void;
  onError: (message: string) => void;
}

export default function BlurCanvas({
  image, regions, mode, intensity, color, onAddRegion, onError,
}: Readonly<BlurCanvasProps>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const ctx = renderRedacted(canvas, image, regions, mode, intensity);
      drawRegionOutlines(ctx, regions, draft, color);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Preview rendering failed.');
    }
  }, [image, regions, mode, intensity, draft, color, onError]);

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const start = canvasPoint(e.currentTarget, e.clientX, e.clientY);
    startRef.current = start;
    setDraft({ x: start.x, y: start.y, width: 0, height: 0 });
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const start = startRef.current;
    if (!start) return;
    const point = canvasPoint(e.currentTarget, e.clientX, e.clientY);
    setDraft(normalizeRect(start.x, start.y, point.x, point.y));
  };

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const start = startRef.current;
    startRef.current = null;
    setDraft(null);
    if (!start) return;
    const point = canvasPoint(e.currentTarget, e.clientX, e.clientY);
    const rect = clampRegion(
      normalizeRect(start.x, start.y, point.x, point.y),
      image.naturalWidth,
      image.naturalHeight,
    );
    if (rect) onAddRegion(rect);
  };

  const onPointerCancel = () => {
    startRef.current = null;
    setDraft(null);
  };

  return (
    <Box sx={{ mt: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider', lineHeight: 0 }}>
      <canvas
        ref={canvasRef}
        aria-label="Image preview — drag to select a region to hide"
        style={{ width: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      />
    </Box>
  );
}
