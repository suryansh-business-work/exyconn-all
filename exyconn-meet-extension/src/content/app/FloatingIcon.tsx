import { forwardRef, useRef } from 'react';
import { ButtonBase, Typography, radius } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import type { Logger } from '@exyconn/logger';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { PanelLayout } from '../../storage/layout';
import type { IconCorner } from '../../storage/prefs';
import { STATUS_COLORS } from '../../theme/status-colors';
import type { IconStatus } from '../../types/meeting';
import { ICON_STATUS_LABEL } from '../../utils/icon-status';
import { useFloatingPosition } from './useFloatingPosition';

/** The pill's footprint, used to keep it on screen. */
const ICON_SIZE = { width: 132, height: 40 };

const GLYPH: Readonly<Record<IconStatus, typeof GraphicEqIcon>> = {
  IDLE: GraphicEqIcon,
  ATTENTION: WarningAmberIcon,
  ACTIVE: FiberManualRecordIcon,
  PROCESSING: HourglassTopIcon,
  ERROR: ErrorOutlinedIcon,
};

/** The visible word next to the glyph, so the state never rests on colour alone. */
const SHORT_LABEL: Readonly<Record<IconStatus, string>> = {
  IDLE: 'Assistant',
  ATTENTION: 'Attention',
  ACTIVE: 'Recording',
  PROCESSING: 'Processing',
  ERROR: 'Error',
};

interface Props {
  status: IconStatus;
  open: boolean;
  panelId: string;
  layout: PanelLayout;
  corner: IconCorner;
  logger: Logger;
  onToggle: () => void;
}

/** The small draggable pill that opens the panel. Arrow keys move it; Enter or Space opens it. */
export const FloatingIcon = forwardRef<HTMLButtonElement, Readonly<Props>>(function FloatingIcon(
  { status, open, panelId, layout, corner, logger, onToggle },
  ref,
) {
  const t = useT();
  const size = useRef(ICON_SIZE).current;
  const { point, onPointerDown, onPointerMove, endDrag, onKeyDown } = useFloatingPosition(
    layout,
    corner,
    size,
    logger,
  );
  const swallowClick = useRef(false);
  const Glyph = GLYPH[status];
  const colors = STATUS_COLORS[status];
  const action = open ? t('collapse the panel') : t('open the panel');

  return (
    <ButtonBase
      ref={ref}
      aria-label={`${t(ICON_STATUS_LABEL[status])}. ${action}`}
      aria-expanded={open}
      aria-controls={panelId}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => {
        swallowClick.current = endDrag();
      }}
      onClick={() => {
        if (!swallowClick.current) {
          onToggle();
        }
        swallowClick.current = false;
      }}
      onKeyDown={onKeyDown}
      sx={{
        position: 'fixed',
        left: point.x,
        top: point.y,
        height: size.height,
        minWidth: size.height,
        maxWidth: size.width,
        px: 1.5,
        gap: 0.75,
        borderRadius: `${radius.pill}px`,
        bgcolor: colors.fill,
        color: colors.ink,
        boxShadow: 3,
        touchAction: 'none',
        cursor: 'grab',
        '&.Mui-focusVisible': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <Glyph fontSize="small" aria-hidden />
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }} aria-hidden>
        {t(SHORT_LABEL[status])}
      </Typography>
    </ButtonBase>
  );
});
