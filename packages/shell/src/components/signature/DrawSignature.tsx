import { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';
import { Box, useTheme } from '@/components/ui';
import { SIGNATURE_HEIGHT } from './typedSignature';

interface DrawSignatureProps {
  label: string;
  /** Receives a PNG data URL after every stroke, and '' when the pad is cleared or resized. */
  onChange: (dataUrl: string) => void;
  /** Bumped by the parent's Clear button. */
  clearKey: number;
  invalid: boolean;
}

/**
 * The drawing surface: `signature_pad` on a canvas sized to its box at the screen's pixel
 * ratio, so strokes stay sharp. Resizing a canvas wipes it, so a resize also clears the value
 * rather than leaving a signature on record that is no longer on screen.
 */
export function DrawSignature({
  label,
  onChange,
  clearKey,
  invalid,
}: Readonly<DrawSignatureProps>) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement;
    const pad = new SignaturePadLib(canvas, { penColor: theme.palette.grey[900] });
    padRef.current = pad;
    const fit = () => {
      const ratio = Math.max(globalThis.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = SIGNATURE_HEIGHT * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      pad.clear();
      onChangeRef.current('');
    };
    const stroke = () => onChangeRef.current(pad.isEmpty() ? '' : pad.toDataURL('image/png'));
    pad.addEventListener('endStroke', stroke);
    globalThis.addEventListener('resize', fit);
    fit();
    return () => {
      pad.removeEventListener('endStroke', stroke);
      globalThis.removeEventListener('resize', fit);
      pad.off();
    };
  }, [theme.palette.grey]);

  useEffect(() => {
    padRef.current?.clear();
  }, [clearKey]);

  return (
    <Box
      component="canvas"
      ref={canvasRef}
      role="img"
      aria-label={label}
      data-testid="signature-canvas"
      sx={{
        display: 'block',
        width: '100%',
        height: SIGNATURE_HEIGHT,
        touchAction: 'none',
        cursor: 'crosshair',
        // Signing paper: always light, so the dark ink reads in either colour mode.
        bgcolor: 'common.white',
        border: 1,
        borderColor: invalid ? 'error.main' : 'divider',
        borderRadius: 1,
      }}
    />
  );
}
