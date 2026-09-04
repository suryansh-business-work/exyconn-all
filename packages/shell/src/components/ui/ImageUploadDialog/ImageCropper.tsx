import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Box, Slider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@exyconn/ui';
import type { CropRect } from './crop-image';

/** Crop shapes offered above the canvas. `null` keeps the image's own aspect ratio. */
const ASPECT_OPTIONS: ReadonlyArray<{ value: string; label: string; ratio: number | null }> = [
  { value: 'original', label: 'Original', ratio: null },
  { value: 'square', label: '1:1', ratio: 1 },
  { value: 'landscape', label: '16:9', ratio: 16 / 9 },
  { value: 'classic', label: '4:3', ratio: 4 / 3 },
  { value: 'portrait', label: '3:4', ratio: 3 / 4 },
  { value: 'story', label: '9:16', ratio: 9 / 16 },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface ImageCropperProps {
  src: string;
  /** Fires on every drag, zoom or ratio change with the rectangle in source pixels. */
  onCropChange: (rect: CropRect) => void;
}

/**
 * Custom crop step: the picked image on a pan-and-zoom canvas with a ratio selector.
 * It reports the crop in the source image's own pixels, which is what gets uploaded —
 * so nothing reaches ImageKit until the user is happy with the framing.
 */
export function ImageCropper({ src, onCropChange }: Readonly<ImageCropperProps>) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [shape, setShape] = useState('original');
  const [naturalAspect, setNaturalAspect] = useState<number | undefined>(undefined);

  const selected = ASPECT_OPTIONS.find((option) => option.value === shape);
  const aspect = selected?.ratio ?? naturalAspect;

  const handleCropComplete = useCallback(
    (_area: Area, pixels: Area) => onCropChange(pixels),
    [onCropChange],
  );

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 280,
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'common.black',
        }}
      >
        <Cropper
          image={src}
          crop={position}
          zoom={zoom}
          aspect={aspect}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onCropChange={setPosition}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          onMediaLoaded={(media) => setNaturalAspect(media.naturalWidth / media.naturalHeight)}
        />
      </Box>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={shape}
        onChange={(_event, next: string | null) => next && setShape(next)}
        aria-label="crop ratio"
        sx={{ flexWrap: 'wrap' }}
      >
        {ASPECT_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          Zoom
        </Typography>
        <Slider
          value={zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          onChange={(_event, next) => setZoom(next as number)}
          aria-label="Zoom"
        />
      </Stack>
    </Stack>
  );
}
