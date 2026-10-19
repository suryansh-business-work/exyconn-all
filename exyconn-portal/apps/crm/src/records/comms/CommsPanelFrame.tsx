import { useEffect, useId, useRef, type ReactNode } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Flex,
  IconButton,
  Paper,
  Text,
  Tooltip,
  portalShadow,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { focusTaken, type CommsPanel, type DockPosition } from './commsStore';
import { useDockDrag } from './useDockDrag';

/** The first field (or button) in the panel's body, where focus lands on open. */
const FIRST_CONTROL =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"], button:not([disabled])';

interface CommsPanelFrameProps {
  panel: CommsPanel;
  title: string;
  position: DockPosition | null;
  /** Lifts the default spot above the row of minimized panels. */
  abovePills: boolean;
  onMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A floating, non-modal window: no backdrop, the page behind stays usable. Drag it by the header
 * (on a phone it fills the bottom of the screen instead); Escape minimizes it.
 */
export function CommsPanelFrame({
  panel,
  title,
  position,
  abovePills,
  onMinimize,
  onClose,
  children,
}: Readonly<CommsPanelFrameProps>) {
  const t = useT();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useDockDrag(panelRef, !isPhone);

  useEffect(() => {
    if (!panel.focusPending) {
      return;
    }
    const first = bodyRef.current?.querySelector<HTMLElement>(FIRST_CONTROL);
    (first ?? panelRef.current)?.focus();
    focusTaken(panel.key);
  }, [panel.focusPending, panel.key]);

  // Escape minimizes. Listened for natively: the dialog itself is not an interactive element.
  useEffect(() => {
    const element = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onMinimize();
      }
    };
    element?.addEventListener('keydown', onKeyDown);
    return () => element?.removeEventListener('keydown', onKeyDown);
  }, [onMinimize]);

  const desktopSpot = position
    ? { left: position.x, top: position.y }
    : { right: theme.spacing(2), bottom: theme.spacing(abovePills ? 8 : 2) };
  const spot = isPhone ? { left: 0, right: 0, bottom: 0 } : desktopSpot;

  return (
    <Paper
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      sx={{
        position: 'fixed',
        ...spot,
        zIndex: theme.zIndex.appBar + 1,
        width: { xs: '100%', sm: theme.spacing(52) },
        maxHeight: { xs: '85vh', sm: `calc(100vh - ${theme.spacing(12)})` },
        display: 'flex',
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        boxShadow: portalShadow[theme.palette.mode].lg,
      }}
    >
      <Flex
        direction="row"
        alignItems="center"
        spacing={1}
        onPointerDown={drag.onPointerDown}
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: 1,
          borderColor: 'divider',
          cursor: isPhone ? 'default' : 'move',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {!isPhone && <DragIndicatorIcon fontSize="small" color="action" aria-hidden />}
        <Text
          id={titleId}
          component="h2"
          weight="semibold"
          noWrap
          sx={{ flexGrow: 1, minWidth: 0 }}
        >
          {title}
        </Text>
        <Tooltip title={t('Minimize')}>
          <IconButton size="small" aria-label={t('Minimize')} onClick={onMinimize}>
            <MinimizeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('Close')}>
          <IconButton size="small" aria-label={t('Close')} onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Flex>
      <Box ref={bodyRef} sx={{ p: 2, overflowY: 'auto' }}>
        {children}
      </Box>
    </Paper>
  );
}
