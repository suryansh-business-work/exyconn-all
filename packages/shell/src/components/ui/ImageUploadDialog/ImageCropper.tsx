import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useT } from '@exyconn/i18n';
import { Stack, ToggleButton, ToggleButtonGroup } from '@exyconn/ui';
import { BackgroundPicker } from './BackgroundPicker';
import { CropStage } from './CropStage';
import { ZoomControl } from './ZoomControl';
import type { CropRect } from './crop-image';
import {
  ASPECT_OPTIONS,
  clampZoom,
  DEFAULT_COLOR,
  MAX_ZOOM,
  MIN_ZOOM,
  ratioOf,
  resolveFill,
  zoomFor,
  type AspectKey,
  type CropOptions,
  type FitMode,
} from './crop-options';
import { useEdgeColor } from './edge-color';

interface ImageCropperProps {
  src: string;
  /** Fires on every drag, zoom, ratio or background change: the crop in source pixels. */
  onCropChange: (rect: CropRect) => void;
  /** How the step starts (shape, fit, background); the defaults suit photos. */
  options?: Readonly<CropOptions>;
}

const CENTRE = { x: 0, y: 0 };

/**
 * Custom crop step: the picked image on a pan-and-zoom canvas with a ratio selector, Fit /
 * Fill and a zoom that goes below 100% so the image can sit inside the frame on a chosen
 * background. It reports the crop in the source image's own pixels plus that background,
 * which is what gets uploaded — nothing reaches ImageKit until the framing is right.
 */
export function ImageCropper({ src, onCropChange, options = {} }: Readonly<ImageCropperProps>) {
  const t = useT();
  const allowTransparent = options.allowTransparent ?? true;
  const [position, setPosition] = useState(CENTRE);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<FitMode | null>(options.fit ?? 'fill');
  const [shape, setShape] = useState<AspectKey>(options.aspect ?? 'original');
  const [naturalAspect, setNaturalAspect] = useState<number | undefined>(undefined);
  const [background, setBackground] = useState(options.background ?? 'blur');
  const [pickedColor, setPickedColor] = useState<string>(DEFAULT_COLOR);
  const [pixels, setPixels] = useState<Area | null>(null);
  const autoColor = useEdgeColor(src);

  const aspect = ratioOf(shape) ?? naturalAspect;
  const fill = useMemo(
    () => resolveFill(background, pickedColor, autoColor, allowTransparent),
    [background, pickedColor, autoColor, allowTransparent],
  );

  useEffect(() => {
    if (pixels) {
      onCropChange({ ...pixels, fill });
    }
  }, [pixels, fill, onCropChange]);

  /** Re-applies a fit mode once both shapes are known, re-centring the image. */
  const applyFit = (mode: FitMode | null, frame: number | undefined, image: number | undefined) => {
    if (mode && frame && image) {
      setZoom(zoomFor(mode, image, frame));
      setPosition(CENTRE);
    }
  };

  const handleZoom = (next: number) => {
    setZoom(clampZoom(next));
    setFitMode(null);
  };

  const handleFit = (mode: FitMode) => {
    setFitMode(mode);
    applyFit(mode, aspect, naturalAspect);
  };

  const handleShape = (next: AspectKey) => {
    setShape(next);
    applyFit(fitMode, ratioOf(next) ?? naturalAspect, naturalAspect);
  };

  const handleMediaLoaded = (media: { naturalWidth: number; naturalHeight: number }) => {
    const natural = media.naturalWidth / media.naturalHeight;
    setNaturalAspect(natural);
    applyFit(fitMode, ratioOf(shape) ?? natural, natural);
  };

  const handleCropComplete = useCallback((_area: Area, next: Area) => setPixels(next), []);

  return (
    <Stack spacing={1.5}>
      <CropStage src={src} fill={fill}>
        <Cropper
          image={src}
          crop={position}
          zoom={zoom}
          aspect={aspect}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          // Zoomed out, the image moves freely inside the frame; at 100% and above it must
          // still cover the frame, as before.
          restrictPosition={zoom >= 1}
          onCropChange={setPosition}
          onZoomChange={handleZoom}
          onCropComplete={handleCropComplete}
          onMediaLoaded={handleMediaLoaded}
        />
      </CropStage>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={shape}
        onChange={(_event, next: AspectKey | null) => next && handleShape(next)}
        aria-label={t('Crop ratio')}
        sx={{ flexWrap: 'wrap' }}
      >
        {ASPECT_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {t(option.label)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <ZoomControl zoom={zoom} fitMode={fitMode} onZoom={handleZoom} onFit={handleFit} />

      <BackgroundPicker
        mode={background}
        color={pickedColor}
        allowTransparent={allowTransparent}
        onModeChange={setBackground}
        onColorChange={setPickedColor}
      />
    </Stack>
  );
}
