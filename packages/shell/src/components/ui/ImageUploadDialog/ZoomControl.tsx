import { useT } from '@exyconn/i18n';
import {
  IconButton,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@exyconn/ui';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_BUTTON_STEP, ZOOM_STEP, type FitMode } from './crop-options';

interface ZoomControlProps {
  zoom: number;
  /** The fit mode the zoom was last set from; `null` once the user zooms by hand. */
  fitMode: FitMode | null;
  onZoom: (zoom: number) => void;
  onFit: (mode: FitMode) => void;
}

const percent = (zoom: number): string => `${Math.round(zoom * 100)}%`;

/**
 * Fit / Fill presets, and a zoom slider from well below 100% (the image shrinks inside the
 * frame, with background around it) up to 300%, with − / + buttons beside it.
 */
export function ZoomControl({ zoom, fitMode, onZoom, onFit }: Readonly<ZoomControlProps>) {
  const t = useT();

  return (
    <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={fitMode}
        onChange={(_event, next: FitMode | null) => next && onFit(next)}
        aria-label={t('Fit image')}
      >
        <ToggleButton value="fit">{t('Fit')}</ToggleButton>
        <ToggleButton value="fill">{t('Fill')}</ToggleButton>
      </ToggleButtonGroup>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1, minWidth: 220 }}>
        <IconButton
          size="small"
          aria-label={t('Zoom out')}
          disabled={zoom <= MIN_ZOOM}
          onClick={() => onZoom(zoom - ZOOM_BUTTON_STEP)}
        >
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <Slider
          value={zoom}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={ZOOM_STEP}
          onChange={(_event, next) => onZoom(next as number)}
          getAriaValueText={percent}
          valueLabelFormat={percent}
          valueLabelDisplay="auto"
          aria-label={t('Zoom')}
        />
        <IconButton
          size="small"
          aria-label={t('Zoom in')}
          disabled={zoom >= MAX_ZOOM}
          onClick={() => onZoom(zoom + ZOOM_BUTTON_STEP)}
        >
          <ZoomInIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="caption"
          aria-hidden
          sx={{ color: 'text.secondary', minWidth: 40, textAlign: 'end' }}
        >
          {percent(zoom)}
        </Typography>
      </Stack>
    </Stack>
  );
}
