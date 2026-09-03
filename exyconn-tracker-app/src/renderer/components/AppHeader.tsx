import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import type { Branding, TrackerStatus } from '@shared/types';
import BrandMark from './BrandMark';
import TrackingPulse from './TrackingPulse';
import WindowControls from './WindowControls';

interface Props {
  branding: Branding | null;
  title: string;
  /** Drives the recording indicator — visible on every page, not just the dashboard. */
  status: TrackerStatus;
  onOpenMenu: () => void;
}

/**
 * The window is frameless, so this bar IS the title bar: it drags the window, and the
 * minimise / maximise / close buttons at its right are the app's own.
 */
const DRAG = { WebkitAppRegion: 'drag' } as const;
const NO_DRAG = { WebkitAppRegion: 'no-drag' } as const;

/** Compact top bar: hamburger, brand logo, the current section name, and window controls. */
export default function AppHeader({
  branding,
  title,
  status,
  onOpenMenu,
}: Readonly<Props>): JSX.Element {
  return (
    <AppBar
      position="static"
      color="transparent"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        color: theme.palette.text.primary,
      })}
    >
      {/* Both text runs shrink (minWidth 0) and truncate. The window is narrow enough that a
          non-shrinking child would push the section name off the right edge — it used to. */}
      <Toolbar
        variant="dense"
        disableGutters
        sx={{ gap: 1, minHeight: 46, px: 1, overflow: 'hidden', ...DRAG }}
      >
        <IconButton
          edge="start"
          size="small"
          color="inherit"
          aria-label="Open navigation"
          onClick={onOpenMenu}
          sx={{ flexShrink: 0, ...NO_DRAG }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', flex: '0 1 auto', minWidth: 0 }}>
          <BrandMark branding={branding} height={20} />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ flex: '1 1 auto', minWidth: 0, textAlign: 'right', fontWeight: 600 }}
        >
          {title}
        </Typography>

        <TrackingPulse status={status} />
        <WindowControls />
      </Toolbar>
    </AppBar>
  );
}
